<?php
// ── Rajyash — Request Notes API ──────────────────────────────────
// GET  /notes.php?request_id=X  → list notes for a request (admin only)
// POST /notes.php?request_id=X  → add a note (admin only)

require __DIR__ . '/config.php';
cors();
$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$me     = requireAuth();
requireRole($me, ['admin']);

$requestId = isset($_GET['request_id']) ? (int)$_GET['request_id'] : 0;
if (!$requestId) jsonOut(['error' => 'request_id required'], 400);

if ($method === 'GET') {
    $stmt = $pdo->prepare("
        SELECT n.id, n.note, n.created_at, u.name AS admin_name
        FROM request_notes n
        JOIN users u ON u.id = n.admin_id
        WHERE n.request_id = ?
        ORDER BY n.created_at DESC
    ");
    $stmt->execute([$requestId]);
    jsonOut($stmt->fetchAll());
}

if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $note = trim($body['note'] ?? '');
    if (!$note) jsonOut(['error' => 'note is required'], 400);

    $pdo->prepare("INSERT INTO request_notes (request_id, admin_id, note) VALUES (?,?,?)")
        ->execute([$requestId, $me['sub'], $note]);

    auditLog($pdo, $me['sub'], 'add_note', 'requests', $requestId, ['note' => substr($note, 0, 80)]);
    jsonOut(['success' => true, 'id' => (int)$pdo->lastInsertId()], 201);
}

jsonOut(['error' => 'Method not allowed'], 405);
