<?php
// ── Rajyash — Drivers API ────────────────────────────────────────
// GET  /drivers.php              → list active drivers (admin only)
// GET  /drivers.php?id=X         → single driver (admin only)

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
            SELECT d.*, u.phone, u.name, u.language
            FROM drivers d
            JOIN users u ON u.id = d.user_id
            WHERE d.id = ? AND d.is_active = 1
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) jsonOut(['error' => 'Not found'], 404);
        jsonOut($row);
    }

    // List active drivers
    $stmt = $pdo->prepare("
        SELECT d.id, d.user_id, d.vehicle_type, d.vehicle_number,
               u.name, u.phone
        FROM drivers d
        JOIN users u ON u.id = d.user_id
        WHERE d.is_active = 1
        ORDER BY u.name
    ");
    $stmt->execute();
    jsonOut($stmt->fetchAll());
}

jsonOut(['error' => 'Method not allowed'], 405);
