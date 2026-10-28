<?php
// ── Rajyash — Trips API ──────────────────────────────────────────
// trips.driver_id = users.id (the driver's user record)
//
// GET  /trips.php              → driver: own active trips
// GET  /trips.php?id=X         → single trip detail
// PUT  /trips.php?id=X         → driver: advance trip status

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
                   don.name AS donor_name, don.phone AS donor_phone, don.address AS donor_address,
                   u.name AS driver_name
            FROM trips t
            JOIN requests r  ON r.id  = t.request_id
            JOIN donors   don ON don.id = r.donor_id
            JOIN users    u   ON u.id  = t.driver_id
            WHERE t.id = ?
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) jsonOut(['error' => 'Not found'], 404);

        // Access: admin or the assigned driver
        if ($me['role'] !== 'admin' && (int)$row['driver_id'] !== (int)$me['sub']) {
            jsonOut(['error' => 'Access denied'], 403);
        }
        jsonOut($row);
    }

    // List
    if ($me['role'] === 'admin') {
        $stmt = $pdo->prepare("
            SELECT t.id, t.status, t.created_at,
                   r.food_type, r.pickup_address,
                   don.name AS donor_name,
                   u.name  AS driver_name
            FROM trips t
            JOIN requests r   ON r.id   = t.request_id
            JOIN donors   don ON don.id = r.donor_id
            JOIN users    u   ON u.id   = t.driver_id
            ORDER BY t.created_at DESC
            LIMIT 200
        ");
        $stmt->execute();
    } else {
        // Driver: list their own active trips (driver_id = me.sub)
        $stmt = $pdo->prepare("
            SELECT t.id, t.status, t.created_at,
                   r.food_type, r.approx_kg, r.pickup_address, r.ready_by,
                   don.name AS donor_name, don.phone AS donor_phone, don.address AS donor_address
            FROM trips t
            JOIN requests r   ON r.id   = t.request_id
            JOIN donors   don ON don.id = r.donor_id
            WHERE t.driver_id = ?
            ORDER BY t.created_at DESC
            LIMIT 50
        ");
        $stmt->execute([$me['sub']]);
        // Note: returns ALL trips for the driver (active + delivered) so portal can show completed section
    }

    jsonOut($stmt->fetchAll());
}

// ── PUT — advance trip status (driver or admin) ───────────────────
if ($method === 'PUT') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if (!$id) jsonOut(['error' => 'id required'], 400);

    // Support both JSON and multipart (for photo upload)
    $isMultipart = strpos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart') !== false;
    $body   = $isMultipart ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);
    $status = $body['status'] ?? '';

    // Handle pickup photo upload
    $pickupPhotoPath = null;
    if (!empty($_FILES['pickup_photo']['tmp_name']) && $_FILES['pickup_photo']['error'] === UPLOAD_ERR_OK) {
        $ext = strtolower(pathinfo($_FILES['pickup_photo']['name'], PATHINFO_EXTENSION));
        if (in_array($ext, ['jpg','jpeg','png','webp'])) {
            $uploadDir = __DIR__ . '/uploads/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
            $filename = 'pickup_' . uniqid('', true) . '.' . $ext;
            if (move_uploaded_file($_FILES['pickup_photo']['tmp_name'], $uploadDir . $filename)) {
                $pickupPhotoPath = 'uploads/' . $filename;
            }
        }
    }

    $driverAllowed = ['ride_started', 'picked_up', 'delivered'];
    $adminAllowed  = ['assigned', 'ride_started', 'picked_up', 'delivered', 'cancelled'];

    $allowed = $me['role'] === 'admin' ? $adminAllowed : $driverAllowed;
    if (!in_array($status, $allowed, true)) jsonOut(['error' => 'Invalid status'], 400);

    // Fetch trip
    $tq = $pdo->prepare("SELECT * FROM trips WHERE id = ? LIMIT 1");
    $tq->execute([$id]);
    $trip = $tq->fetch();
    if (!$trip) jsonOut(['error' => 'Trip not found'], 404);

    // Check ownership for drivers
    if ($me['role'] !== 'admin' && (int)$trip['driver_id'] !== (int)$me['sub']) {
        jsonOut(['error' => 'Access denied'], 403);
    }

    if ($pickupPhotoPath) {
        $pdo->prepare("UPDATE trips SET status = ?, pickup_photo = ? WHERE id = ?")->execute([$status, $pickupPhotoPath, $id]);
    } else {
        $pdo->prepare("UPDATE trips SET status = ? WHERE id = ?")->execute([$status, $id]);
    }

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
