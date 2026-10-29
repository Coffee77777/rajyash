<?php
// ── Rajyash — Analytics API ──────────────────────────────────────
// GET /analytics.php → admin dashboard analytics data

require __DIR__ . '/config.php';
cors();
$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') jsonOut(['error' => 'Method not allowed'], 405);

$me = requireAuth();
requireRole($me, ['admin']);

// ── This Month stats ─────────────────────────────────────────────
$monthStart = date('Y-m-01 00:00:00');

$stmt = $pdo->prepare("
    SELECT
        COUNT(*) AS total,
        SUM(status IN ('delivered','closed')) AS delivered,
        SUM(COALESCE(approx_kg, 0)) AS kg_rescued,
        SUM(status IN ('assigned','accepted','ride_started','picked_up')) AS active
    FROM requests
    WHERE created_at >= ?
");
$stmt->execute([$monthStart]);
$thisMonth = $stmt->fetch();

// ── All-time stats ────────────────────────────────────────────────
$stmt = $pdo->query("
    SELECT
        COUNT(*) AS total,
        SUM(status IN ('delivered','closed')) AS delivered,
        SUM(COALESCE(approx_kg, 0)) AS kg_rescued
    FROM requests
");
$allTime = $stmt->fetch();

// ── Requests by day of week (last 90 days) ────────────────────────
$stmt = $pdo->prepare("
    SELECT DAYOFWEEK(created_at) AS dow, COUNT(*) AS cnt
    FROM requests
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
    GROUP BY dow
    ORDER BY dow
");
$stmt->execute();
$dowRaw = $stmt->fetchAll();
$dowMap = [];
foreach ($dowRaw as $r) $dowMap[(int)$r['dow']] = (int)$r['cnt'];
$days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
$byDow = [];
for ($i = 1; $i <= 7; $i++) {
    $byDow[] = ['day' => $days[$i-1], 'count' => $dowMap[$i] ?? 0];
}

// ── Top 5 donors ──────────────────────────────────────────────────
$stmt = $pdo->query("
    SELECT d.name, COUNT(r.id) AS trips,
           SUM(COALESCE(r.approx_kg, 0)) AS total_kg
    FROM requests r
    JOIN donors d ON d.id = r.donor_id
    GROUP BY d.id
    ORDER BY trips DESC
    LIMIT 5
");
$topDonors = $stmt->fetchAll();

// ── Status breakdown ──────────────────────────────────────────────
$stmt = $pdo->query("
    SELECT status, COUNT(*) AS cnt
    FROM requests
    GROUP BY status
");
$breakdown = [];
foreach ($stmt->fetchAll() as $r) $breakdown[$r['status']] = (int)$r['cnt'];

// ── Monthly trend (last 6 months) ─────────────────────────────────
$stmt = $pdo->query("
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
           COUNT(*) AS total,
           SUM(status IN ('delivered','closed')) AS delivered
    FROM requests
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY month
    ORDER BY month ASC
");
$monthlyTrend = $stmt->fetchAll();

jsonOut([
    'this_month'       => $thisMonth,
    'all_time'         => $allTime,
    'by_dow'           => $byDow,
    'top_donors'       => $topDonors,
    'status_breakdown' => $breakdown,
    'monthly_trend'    => $monthlyTrend,
]);
