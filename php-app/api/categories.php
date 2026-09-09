<?php
require_once __DIR__ . '/../includes/bootstrap.php';

if (!is_logged_in()) {
    json_error('Unauthorized', 401);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $rows = db()->query(
        'SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
         FROM categories c ORDER BY name ASC'
    )->fetchAll();
    json_response($rows);
}

$user = require_role_json(['ADMIN']);
verify_csrf();

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);
    $count = db()->prepare('SELECT COUNT(*) FROM products WHERE category_id = ?');
    $count->execute([$id]);
    if ((int) $count->fetchColumn() > 0) {
        json_error('Cannot delete: products use this category', 409);
    }
    db()->prepare('DELETE FROM categories WHERE id = ?')->execute([$id]);
    json_response(['ok' => true]);
}

// POST: create
$body = json_input();
$name = trim($body['name'] ?? '');
$description = trim($body['description'] ?? '');

if ($name === '') {
    json_error('Name is required');
}

try {
    $stmt = db()->prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
    $stmt->execute([$name, $description ?: null]);
    json_response(['id' => db()->lastInsertId(), 'name' => $name, 'description' => $description], 201);
} catch (PDOException $e) {
    json_error('Category name already exists', 409);
}
