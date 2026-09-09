<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_role(['ADMIN']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect('inventory/index.php');
}
verify_csrf();

$productId = (int) ($_POST['product_id'] ?? 0);
$type = $_POST['type'] ?? '';
$quantity = (int) ($_POST['quantity'] ?? 0);
$reason = trim($_POST['reason'] ?? '');

$allowed = ['RECEIVE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'];
if (!in_array($type, $allowed, true) || $quantity <= 0) {
    flash_set('error', 'Invalid stock adjustment.');
    redirect('inventory/edit.php?id=' . $productId);
}

$pdo = db();
$stmt = $pdo->prepare('SELECT * FROM products WHERE id = ?');
$stmt->execute([$productId]);
$product = $stmt->fetch();

if (!$product) {
    flash_set('error', 'Product not found.');
    redirect('inventory/index.php');
}

$delta = $type === 'ADJUSTMENT_OUT' ? -$quantity : $quantity;

if ((int) $product['quantity'] + $delta < 0) {
    flash_set('error', "Cannot remove {$quantity} units — only {$product['quantity']} in stock.");
    redirect('inventory/edit.php?id=' . $productId);
}

$pdo->beginTransaction();
$pdo->prepare('UPDATE products SET quantity = quantity + ? WHERE id = ?')->execute([$delta, $productId]);
$pdo->prepare('INSERT INTO stock_movements (product_id, type, quantity, reason, user_id) VALUES (?, ?, ?, ?, ?)')
    ->execute([$productId, $type, $quantity, $reason ?: null, current_user()['id']]);
$pdo->commit();

flash_set('success', 'Stock updated.');
redirect('inventory/edit.php?id=' . $productId);
