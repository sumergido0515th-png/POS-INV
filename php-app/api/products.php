<?php
require_once __DIR__ . '/../includes/bootstrap.php';

if (!is_logged_in()) {
    json_error('Unauthorized', 401);
}

$q = trim($_GET['q'] ?? '');
$categoryId = $_GET['category_id'] ?? '';
$activeOnly = ($_GET['active_only'] ?? 'true') !== 'false';

$sql = 'SELECT p.*, c.name AS category_name, b.name AS brand_name
        FROM products p
        JOIN categories c ON c.id = p.category_id
        LEFT JOIN brands b ON b.id = p.brand_id
        WHERE 1=1';
$params = [];

if ($activeOnly) {
    $sql .= ' AND p.is_active = 1';
}
if ($categoryId !== '') {
    $sql .= ' AND p.category_id = ?';
    $params[] = $categoryId;
}
if ($q !== '') {
    $sql .= ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
    $like = '%' . $q . '%';
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
}
$sql .= ' ORDER BY p.name ASC';

$stmt = db()->prepare($sql);
$stmt->execute($params);
$products = $stmt->fetchAll();

foreach ($products as &$p) {
    $p['cost_price'] = (float) $p['cost_price'];
    $p['selling_price'] = (float) $p['selling_price'];
    $p['quantity'] = (int) $p['quantity'];
    $p['reorder_level'] = (int) $p['reorder_level'];
    $p['is_active'] = (bool) $p['is_active'];
}

json_response($products);
