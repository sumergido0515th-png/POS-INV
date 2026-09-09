<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_role(['ADMIN']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect('inventory/index.php');
}
verify_csrf();

$id = (int) ($_POST['id'] ?? 0);

$stmt = db()->prepare('SELECT COUNT(*) FROM sale_items WHERE product_id = ?');
$stmt->execute([$id]);
$referenced = (int) $stmt->fetchColumn();

if ($referenced > 0) {
    db()->prepare('UPDATE products SET is_active = 0 WHERE id = ?')->execute([$id]);
    flash_set('success', 'Product deactivated (it has sales history, so it was kept for reporting).');
} else {
    db()->prepare('DELETE FROM stock_movements WHERE product_id = ?')->execute([$id]);
    db()->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);
    flash_set('success', 'Product deleted.');
}

redirect('inventory/index.php');
