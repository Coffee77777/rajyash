<?php
// ── Rajyash — Auth API ───────────────────────────────────────────
// POST /auth.php  { "phone": "9876543210", "password": "..." }
//   → { token, user: { id, name, role, phone } }
//
// POST /auth.php?action=register  (admin-only — creates users)
//   → { success, id }

require __DIR__ . '/config.php';
cors();
$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'login';

if ($method !== 'POST') jsonOut(['error' => 'Method not allowed'], 405);

$body = json_decode(file_get_contents('php://input'), true) ?? [];

// ── LOGIN ─────────────────────────────────────────────────────────
if ($action === 'login') {
    $phone    = trim($body['phone'] ?? '');
    $password = $body['password'] ?? '';

    if (!$phone || !$password) {
        jsonOut(['error' => 'Phone and password are required'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE phone = ? AND is_active = 1 LIMIT 1");
    $stmt->execute([$phone]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'] ?? '')) {
        jsonOut(['error' => 'Invalid phone number or password'], 401);
    }

    $token = jwtEncode([
        'sub'  => $user['id'],
        'role' => $user['role'],
        'name' => $user['name'],
    ]);

    jsonOut([
        'token' => $token,
        'user'  => [
            'id'    => $user['id'],
            'name'  => $user['name'],
            'role'  => $user['role'],
            'phone' => $user['phone'],
            'lang'  => $user['language'],
        ],
    ]);
}

// ── REGISTER (admin creates a user) ──────────────────────────────
if ($action === 'register') {
    $me = requireAuth();
    requireRole($me, ['admin']);

    $phone    = trim($body['phone'] ?? '');
    $name     = trim($body['name']  ?? '');
    $role     = $body['role']     ?? '';
    $password = $body['password'] ?? '';
    $lang     = in_array($body['language'] ?? '', ['en','hi','gu']) ? $body['language'] : 'en';

    if (!$phone || !$name || !$role || !$password) {
        jsonOut(['error' => 'phone, name, role, password are required'], 400);
    }
    if (!in_array($role, ['admin','driver','requester'], true)) {
        jsonOut(['error' => 'Invalid role'], 400);
    }
    if (strlen($password) < 6) {
        jsonOut(['error' => 'Password must be at least 6 characters'], 400);
    }

    // Check duplicate phone
    $chk = $pdo->prepare("SELECT id FROM users WHERE phone = ? LIMIT 1");
    $chk->execute([$phone]);
    if ($chk->fetch()) jsonOut(['error' => 'Phone number already registered'], 409);

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $pdo->prepare(
        "INSERT INTO users (phone, name, role, language, password_hash) VALUES (?,?,?,?,?)"
    )->execute([$phone, $name, $role, $lang, $hash]);

    $newId = (int)$pdo->lastInsertId();
    auditLog($pdo, $me['sub'], 'create_user', 'users', $newId, ['role' => $role, 'phone' => $phone]);

    jsonOut(['success' => true, 'id' => $newId], 201);
}

// ── ME — verify token + return current user ───────────────────────
if ($action === 'me') {
    $me = requireAuth();
    $stmt = $pdo->prepare("SELECT id, name, role, phone, language FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$me['sub']]);
    $user = $stmt->fetch();
    if (!$user) jsonOut(['error' => 'User not found'], 404);
    jsonOut($user);
}

jsonOut(['error' => 'Unknown action'], 400);
