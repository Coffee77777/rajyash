<?php
// ── Rajyash — Drivers API ────────────────────────────────────────
// GET  /drivers.php              → list active drivers (admin only)
// GET  /drivers.php?id=X         → single driver by user_id (admin only)

require __DIR__ . '/config.php';
cors();
$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $me = requireAuth();
    requireRole($me, ['admin']);

    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($id) {
        $stmt = $pdo->prepare("
            SELECT u.id, u.name, u.phone, d.vehicle_number, d.rate_per_km
            FROM users u
            JOIN drivers d ON d.user_id = u.id
            WHERE u.id = ? AND u.is_active = 1
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) jsonOut(['error' => 'Not found'], 404);
        jsonOut($row);
    }

    // List active drivers
    $stmt = $pdo->prepare("
        SELECT u.id, u.name, u.phone,
               d.vehicle_number, d.rate_per_km
        FROM users u
        JOIN drivers d ON d.user_id = u.id
        WHERE u.role = 'driver' AND u.is_active = 1
        ORDER BY u.name
    ");
    $stmt->execute();
    jsonOut($stmt->fetchAll());
}

if ($method === 'POST') {
    $me = requireAuth();
    requireRole($me, ['admin']);

    $body      = json_decode(file_get_contents('php://input'), true) ?? [];
    $userId    = isset($body['user_id']) ? (int)$body['user_id'] : 0;
    $vehicleNo = trim($body['vehicle_number'] ?? '');

    if (!$userId) jsonOut(['error' => 'user_id required'], 400);

    // Verify user exists and is a driver
    $chk = $pdo->prepare("SELECT id FROM users WHERE id = ? AND role = 'driver' LIMIT 1");
    $chk->execute([$userId]);
    if (!$chk->fetch()) jsonOut(['error' => 'Driver user not found'], 404);

    // Check if drivers record already exists
    $ex = $pdo->prepare("SELECT id FROM drivers WHERE user_id = ? LIMIT 1");
    $ex->execute([$userId]);
    if ($ex->fetch()) jsonOut(['success' => true]); // already exists, idempotent

    $pdo->prepare("INSERT INTO drivers (user_id, vehicle_number) VALUES (?,?)")
        ->execute([$userId, $vehicleNo ?: null]);

    auditLog($pdo, $me['sub'], 'create_driver', 'drivers', $userId, ['vehicle_number' => $vehicleNo]);
    jsonOut(['success' => true], 201);
}

if ($method === 'PUT') {
    $me = requireAuth();
    requireRole($me, ['admin']);

    $id   = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if (!$id) jsonOut(['error' => 'id required'], 400);

    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    // Verify driver exists
    $chk = $pdo->prepare("SELECT u.id FROM users u JOIN drivers d ON d.user_id = u.id WHERE u.id = ? AND u.role = 'driver' LIMIT 1");
    $chk->execute([$id]);
    if (!$chk->fetch()) jsonOut(['error' => 'Driver not found'], 404);

    $updates = [];
    $params  = [];

    if (isset($body['vehicle_number'])) {
        $pdo->prepare("UPDATE drivers SET vehicle_number = ? WHERE user_id = ?")
            ->execute([trim($body['vehicle_number']), $id]);
    }

    if (isset($body['is_active'])) {
        $active = $body['is_active'] ? 1 : 0;
        $pdo->prepare("UPDATE users SET is_active = ? WHERE id = ?")
            ->execute([$active, $id]);
    }

    if (isset($body['name'])) {
        $pdo->prepare("UPDATE users SET name = ? WHERE id = ?")
            ->execute([trim($body['name']), $id]);
    }

    auditLog($pdo, $me['sub'], 'update_driver', 'users', $id, $body);
    jsonOut(['success' => true]);
}

jsonOut(['error' => 'Method not allowed'], 405);
