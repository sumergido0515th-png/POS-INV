<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_role(['ADMIN']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect('sales/index.php');
}
verify_csrf();

$id = (int) ($_POST['id'] ?? 0);
$pdo = db();

$stmt = $pdo->prepare('SELECT * FROM sales WHERE id = ?');
$stmt->execute([$id]);
$sale = $stmt->fetch();

if (!$sale) {
    flash_set('error', 'Sale not found.');
    redirect('sales/index.php');
}
if ($sale['status'] !== 'COMPLETED') {
    flash_set('error', 'Sale is already voided or refunded.');
    redirect('sales/view.php?id=' . $id);
}

$itemsStmt = $pdo->prepare('SELECT * FROM sale_items WHERE sale_id = ?');
$itemsStmt->execute([$id]);
$items = $itemsStmt->fetchAll();

$pdo->beginTransaction();
foreach ($items as $item) {
    $pdo->prepare('UPDATE products SET quantity = quantity + ? WHERE id = ?')->execute([$item['quantity'], $item['product_id']]);
    $pdo->prepare("INSERT INTO stock_movements (product_id, type, quantity, reason, user_id, sale_id) VALUES (?, 'RETURN', ?, ?, ?, ?)")
        ->execute([$item['product_id'], $item['quantity'], 'Void of ' . $sale['invoice_no'], current_user()['id'], $id]);
}
$pdo->prepare("UPDATE sales SET status = 'VOIDED' WHERE id = ?")->execute([$id]);
$pdo->commit();

flash_set('success', 'Sale voided and stock restored.');
redirect('sales/view.php?id=' . $id);
