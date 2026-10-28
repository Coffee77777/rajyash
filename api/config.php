<?php
// ── Rajyash API — config & helpers ──────────────────────────────
// Never commit .env — credentials come from environment or .env.local

$host = getenv('DB_HOST') ?: '127.0.0.1';
$db   = getenv('DB_NAME') ?: 'u721015971_rajyash';
$user = getenv('DB_USER') ?: 'u721015971_rajyash';
$pass = getenv('DB_PASS') ?: '';
$jwt_secret = getenv('JWT_SECRET') ?: 'change_me_in_production';

// ── CORS ─────────────────────────────────────────────────────────
function cors(): void {
    $allowed = ['https://rajyash.vercel.app', 'http://localhost:3000', 'http://localhost:3001'];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, $allowed, true)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
}

// ── DB ───────────────────────────────────────────────────────────
function getDB(): PDO {
    global $host, $db, $user, $pass;
    static $pdo = null;
    if ($pdo) return $pdo;
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db;charset=utf8mb4",
        $user, $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
         PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    return $pdo;
}

// ── JSON response ────────────────────────────────────────────────
function jsonOut(mixed $data, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// ── JWT (lightweight, HS256) ─────────────────────────────────────
function jwtEncode(array $payload): string {
    global $jwt_secret;
    $header  = base64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['iat'] = time();
    $body    = base64url(json_encode($payload));
    $sig     = base64url(hash_hmac('sha256', "$header.$body", $jwt_secret, true));
    return "$header.$body.$sig";
}

function jwtDecode(string $token): ?array {
    global $jwt_secret;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$header, $body, $sig] = $parts;
    $expected = base64url(hash_hmac('sha256', "$header.$body", $jwt_secret, true));
    if (!hash_equals($expected, $sig)) return null;
    $payload = json_decode(base64_decode(strtr($body, '-_', '+/')), true);
    return $payload ?: null;
}

function base64url(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

// ── Auth middleware ──────────────────────────────────────────────
// Returns decoded token payload or sends 401
function requireAuth(): array {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($auth, 'Bearer ')) {
        jsonOut(['error' => 'Authentication required'], 401);
    }
    $payload = jwtDecode(substr($auth, 7));
    if (!$payload) jsonOut(['error' => 'Invalid or expired token'], 401);
    return $payload;
}

// ── Role guard ───────────────────────────────────────────────────
function requireRole(array $payload, array $roles): void {
    if (!in_array($payload['role'], $roles, true)) {
        jsonOut(['error' => 'Access denied'], 403);
    }
}

// ── Audit log ────────────────────────────────────────────────────
function auditLog(PDO $pdo, int $actorId, string $action, string $entity, ?int $entityId = null, mixed $detail = null): void {
    try {
        $pdo->prepare(
            "INSERT INTO audit_log (actor_id, action, entity, entity_id, detail) VALUES (?,?,?,?,?)"
        )->execute([$actorId, $action, $entity, $entityId, $detail ? json_encode($detail) : null]);
    } catch (\Throwable) { /* non-fatal */ }
}
