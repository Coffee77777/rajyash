<?php
// ── Rajyash — Pickup Requests API ───────────────────────────────
// GET  /requests.php              → list (admin: all, requester: own)
// GET  /requests.php?id=X         → single request
// POST /requests.php              → submit new request (public — no auth)
// PUT  /requests.php?id=X         → update status (admin only)

require __DIR__ . '/config.php';
cors();
$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET ──────────────────────────────────────────────────────────
if ($method === 'GET') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($id) {
        $stmt = $pdo->prepare("
            SELECT r.*, d.name AS donor_name, d.phone AS donor_phone,
                   u.name AS requester_name
            FROM requests r
            JOIN donors  d ON d.id = r.donor_id
            JOIN users   u ON u.id = r.requested_by
            WHERE r.id = ?
        ");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) jsonOut(['error' => 'Not found'], 404);
        jsonOut($row);
    }

    // List — requires auth
    $me = requireAuth();
    if ($me['role'] === 'admin') {
        $status = $_GET['status'] ?? '';
        $sql = "SELECT r.*, d.name AS donor_name, u.name AS requester_name
                FROM requests r
                JOIN donors d ON d.id = r.donor_id
                JOIN users  u ON u.id = r.requested_by";
        $params = [];
        if ($status) { $sql .= " WHERE r.status = ?"; $params[] = $status; }
        $sql .= " ORDER BY r.created_at DESC LIMIT 200";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        jsonOut($stmt->fetchAll());
    } else {
        // Requester sees own requests
        $stmt = $pdo->prepare("
            SELECT r.*, d.name AS donor_name
            FROM requests r
            JOIN donors d ON d.id = r.donor_id
            WHERE r.requested_by = ?
            ORDER BY r.created_at DESC
        ");
        $stmt->execute([$me['sub']]);
        jsonOut($stmt->fetchAll());
    }
}

// ── POST — submit new request (public, no auth needed) ───────────
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    // Required fields
    foreach (['donor_name','donor_phone','donor_address','food_type','ready_by','pickup_address'] as $f) {
        if (empty($body[$f])) jsonOut(['error' => "$f is required"], 400);
    }

    // Validate ready_by is a valid datetime
    $readyBy = $body['ready_by'];
    if (!strtotime($readyBy)) jsonOut(['error' => 'ready_by must be a valid date/time'], 400);

    // Upsert donor (match by phone)
    $donorPhone = preg_replace('/\D/', '', $body['donor_phone']);
    $dstmt = $pdo->prepare("SELECT id FROM donors WHERE phone = ? LIMIT 1");
    $dstmt->execute([$donorPhone]);
    $donor = $dstmt->fetch();

    if ($donor) {
        $donorId = $donor['id'];
    } else {
        $pdo->prepare(
            "INSERT INTO donors (name, address, phone) VALUES (?,?,?)"
        )->execute([
            trim($body['donor_name']),
            trim($body['donor_address']),
            $donorPhone,
        ]);
        $donorId = (int)$pdo->lastInsertId();
    }

    // Create or find requester user (public submitter gets requester role)
    $rstmt = $pdo->prepare("SELECT id FROM users WHERE phone = ? LIMIT 1");
    $rstmt->execute([$donorPhone]);
    $reqUser = $rstmt->fetch();
    if ($reqUser) {
        $requesterId = $reqUser['id'];
    } else {
        $pdo->prepare(
            "INSERT INTO users (phone, name, role) VALUES (?,?,?)"
        )->execute([$donorPhone, trim($body['donor_name']), 'requester']);
        $requesterId = (int)$pdo->lastInsertId();
    }

    $pdo->prepare("
        INSERT INTO requests
            (donor_id, requested_by, food_type, approx_kg, ready_by, pickup_address, status)
        VALUES (?,?,?,?,?,?,'requested')
    ")->execute([
        $donorId,
        $requesterId,
        trim($body['food_type']),
        isset($body['approx_kg']) ? (float)$body['approx_kg'] : null,
        date('Y-m-d H:i:s', strtotime($readyBy)),
        trim($body['pickup_address']),
    ]);

    $newId = (int)$pdo->lastInsertId();
    jsonOut(['success' => true, 'id' => $newId, 'tracking_id' => 'RJ' . str_pad($newId, 5, '0', STR_PAD_LEFT)], 201);
}

// ── PUT — update status (admin only) ─────────────────────────────
if ($method === 'PUT') {
    $me = requireAuth();
    requireRole($me, ['admin']);

    $id   = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if (!$id) jsonOut(['error' => 'id required'], 400);

    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $status = $body['status'] ?? '';

    $valid = ['requested','under_review','assigned','accepted','declined',
              'ride_started','picked_up','delivered','closed','cancelled'];
    if (!in_array($status, $valid, true)) jsonOut(['error' => 'Invalid status'], 400);

    // Fetch current status
    $cur = $pdo->prepare("SELECT status FROM requests WHERE id = ? LIMIT 1");
    $cur->execute([$id]);
    $row = $cur->fetch();
    if (!$row) jsonOut(['error' => 'Request not found'], 404);

    $pdo->prepare("UPDATE requests SET status = ? WHERE id = ?")->execute([$status, $id]);
    auditLog($pdo, $me['sub'], 'update_status', 'requests', $id,
        ['from' => $row['status'], 'to' => $status]);

    jsonOut(['success' => true]);
}

// ── PATCH — assign driver (admin only) ───────────────────────────
if ($method === 'PATCH') {
    $me = requireAuth();
    requireRole($me, ['admin']);

    $id   = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if (!$id) jsonOut(['error' => 'id required'], 400);

    $body      = json_decode(file_get_contents('php://input'), true) ?? [];
    $driverId  = isset($body['driver_id']) ? (int)$body['driver_id'] : 0;
    if (!$driverId) jsonOut(['error' => 'driver_id required'], 400);

    // Verify request exists
    $rq = $pdo->prepare("SELECT id, status FROM requests WHERE id = ? LIMIT 1");
    $rq->execute([$id]);
    $req = $rq->fetch();
    if (!$req) jsonOut(['error' => 'Request not found'], 404);

    // Verify driver exists
    $dq = $pdo->prepare("SELECT id, user_id FROM drivers WHERE id = ? AND is_active = 1 LIMIT 1");
    $dq->execute([$driverId]);
    $drv = $dq->fetch();
    if (!$drv) jsonOut(['error' => 'Driver not found'], 404);

    // Create or update trip
    $tq = $pdo->prepare("SELECT id FROM trips WHERE request_id = ? LIMIT 1");
    $tq->execute([$id]);
    $trip = $tq->fetch();

    if ($trip) {
        $pdo->prepare("UPDATE trips SET driver_id = ?, status = 'assigned' WHERE id = ?")
            ->execute([$driverId, $trip['id']]);
        $tripId = $trip['id'];
    } else {
        $pdo->prepare("INSERT INTO trips (request_id, driver_id, status) VALUES (?,?,'assigned')")
            ->execute([$id, $driverId]);
        $tripId = (int)$pdo->lastInsertId();
    }

    // Update request status to assigned
    $pdo->prepare("UPDATE requests SET status = 'assigned' WHERE id = ?")->execute([$id]);
    auditLog($pdo, $me['sub'], 'assign_driver', 'requests', $id,
        ['driver_id' => $driverId, 'trip_id' => $tripId]);

    jsonOut(['success' => true, 'trip_id' => $tripId]);
}

jsonOut(['error' => 'Method not allowed'], 405);
