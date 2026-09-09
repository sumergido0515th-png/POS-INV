<?php
require_once __DIR__ . '/../includes/bootstrap.php';

if (!is_logged_in()) {
    json_error('Unauthorized', 401);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $rows = db()->query(
        'SELECT s.*, (SELECT COUNT(*) FROM products p WHERE p.supplier_id = s.id) AS product_count
         FROM suppliers s ORDER BY name ASC'
    )->fetchAll();
    json_response($rows);
}

require_role_json(['ADMIN']);
verify_csrf();

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);
    $count = db()->prepare('SELECT COUNT(*) FROM products WHERE supplier_id = ?');
    $count->execute([$id]);
    if ((int) $count->fetchColumn() > 0) {
        json_error('Cannot delete: products use this supplier', 409);
    }
    db()->prepare('DELETE FROM suppliers WHERE id = ?')->execute([$id]);
    json_response(['ok' => true]);
}

$body = json_input();
$name = trim($body['name'] ?? '');
if ($name === '') {
    json_error('Name is required');
}
$stmt = db()->prepare('INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)');
$stmt->execute([
    $name,
    trim($body['contact_person'] ?? '') ?: null,
    trim($body['phone'] ?? '') ?: null,
    trim($body['email'] ?? '') ?: null,
    trim($body['address'] ?? '') ?: null,
]);
json_response(['id' => db()->lastInsertId(), 'name' => $name], 201);
