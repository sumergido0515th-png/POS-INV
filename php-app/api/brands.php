<?php
require_once __DIR__ . '/../includes/bootstrap.php';

if (!is_logged_in()) {
    json_error('Unauthorized', 401);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $rows = db()->query(
        'SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id) AS product_count
         FROM brands b ORDER BY name ASC'
    )->fetchAll();
    json_response($rows);
}

require_role_json(['ADMIN']);
verify_csrf();

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);
    $count = db()->prepare('SELECT COUNT(*) FROM products WHERE brand_id = ?');
    $count->execute([$id]);
    if ((int) $count->fetchColumn() > 0) {
        json_error('Cannot delete: products use this brand', 409);
    }
    db()->prepare('DELETE FROM brands WHERE id = ?')->execute([$id]);
    json_response(['ok' => true]);
}

$body = json_input();
$name = trim($body['name'] ?? '');
if ($name === '') {
    json_error('Name is required');
}
try {
    $stmt = db()->prepare('INSERT INTO brands (name) VALUES (?)');
    $stmt->execute([$name]);
    json_response(['id' => db()->lastInsertId(), 'name' => $name], 201);
} catch (PDOException $e) {
    json_error('Brand name already exists', 409);
}
