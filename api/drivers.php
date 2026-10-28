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

jsonOut(['error' => 'Method not allowed'], 405);
