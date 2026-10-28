<?php
// ── Rajyash — Trips API ──────────────────────────────────────────
// GET  /trips.php              → driver: own assigned trips
// GET  /trips.php?id=X         → single trip detail
// PUT  /trips.php?id=X         → driver: advance trip status
//   body: { "status": "ride_started" | "picked_up" | "delivered" }

require __DIR__ . '/config.php';
cors();
$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$me     = requireAuth();

// ── GET ──────────────────────────────────────────────────────────
if ($method === 'GET') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($id) {
        $stmt = $pdo->prepare("
            SELECT t.*,
                   r.food_type, r.approx_kg, r.ready_by, r.pickup_address, r.status AS req_status,
                   d.name AS donor_name, d.phone AS donor_phone, d.address AS donor_address,
                   u.name AS driver_name
            FROM trips t
            JOIN requests r ON r.id = t.request_id
            JOIN donors   d ON d.id = r.donor_id
            JOIN drivers  drv ON drv.id = t.driver_id
            JOIN users    u ON u.id = drv.user_id
            WHERE t.id = ?
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) jsonOut(['error' => 'Not found'], 404);

        // Access: admin or the assigned driver
        if ($me['role'] !== 'admin') {
            $drvCheck = $pdo->prepare("SELECT id FROM drivers WHERE user_id = ? AND id = ? LIMIT 1");
            $drvCheck->execute([$me['sub'], $row['driver_id']]);
            if (!$drvCheck->fetch()) jsonOut(['error' => 'Access denied'], 403);
        }
        jsonOut($row);
    }

    // List
    if ($me['role'] === 'admin') {
        $stmt = $pdo->prepare("
            SELECT t.id, t.status, t.created_at,
                   r.food_type, r.pickup_address,
                   d.name AS donor_name,
                   u.name AS driver_name
            FROM trips t
            JOIN requests r ON r.id = t.request_id
            JOIN donors   d ON d.id = r.donor_id
            JOIN drivers  drv ON drv.id = t.driver_id
            JOIN users    u ON u.id = drv.user_id
            ORDER BY t.created_at DESC
            LIMIT 200
        ");
        $stmt->execute();
    } else {
        // Driver: find their driver record then list assigned trips
        $drvQ = $pdo->prepare("SELECT id FROM drivers WHERE user_id = ? AND is_active = 1 LIMIT 1");
        $drvQ->execute([$me['sub']]);
        $drv = $drvQ->fetch();
        if (!$drv) jsonOut(['error' => 'No driver profile found'], 404);

        $stmt = $pdo->prepare("
            SELECT t.id, t.status, t.created_at,
                   r.food_type, r.approx_kg, r.pickup_address, r.ready_by,
                   d.name AS donor_name, d.phone AS donor_phone, d.address AS donor_address
            FROM trips t
            JOIN requests r ON r.id = t.request_id
            JOIN donors   d ON d.id = r.donor_id
            WHERE t.driver_id = ?
              AND t.status NOT IN ('delivered','cancelled')
            ORDER BY t.created_at DESC
            LIMIT 50
        ");
        $stmt->execute([$drv['id']]);
    }

    jsonOut($stmt->fetchAll());
}

// ── PUT — advance trip status (driver or admin) ───────────────────
if ($method === 'PUT') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if (!$id) jsonOut(['error' => 'id required'], 400);

    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $status = $body['status'] ?? '';

    // Driver-allowed transitions only
    $driverAllowed = ['ride_started', 'picked_up', 'delivered'];
    $adminAllowed  = ['assigned', 'ride_started', 'picked_up', 'delivered', 'cancelled'];

    $allowed = $me['role'] === 'admin' ? $adminAllowed : $driverAllowed;
    if (!in_array($status, $allowed, true)) jsonOut(['error' => 'Invalid status'], 400);

    // Fetch trip
    $tq = $pdo->prepare("
        SELECT t.*, drv.user_id AS driver_user_id
        FROM trips t
        JOIN drivers drv ON drv.id = t.driver_id
        WHERE t.id = ? LIMIT 1
    ");
    $tq->execute([$id]);
    $trip = $tq->fetch();
    if (!$trip) jsonOut(['error' => 'Trip not found'], 404);

    // Check ownership for drivers
    if ($me['role'] !== 'admin' && (int)$trip['driver_user_id'] !== (int)$me['sub']) {
        jsonOut(['error' => 'Access denied'], 403);
    }

    $pdo->prepare("UPDATE trips SET status = ? WHERE id = ?")->execute([$status, $id]);

    // Mirror status to request
    $reqStatus = match($status) {
        'ride_started' => 'ride_started',
        'picked_up'    => 'picked_up',
        'delivered'    => 'delivered',
        default        => null,
    };
    if ($reqStatus) {
        $pdo->prepare("UPDATE requests SET status = ? WHERE id = ?")
            ->execute([$reqStatus, $trip['request_id']]);
    }

    auditLog($pdo, $me['sub'], 'trip_status', 'trips', $id,
        ['from' => $trip['status'], 'to' => $status]);

    jsonOut(['success' => true]);
}

jsonOut(['error' => 'Method not allowed'], 405);
