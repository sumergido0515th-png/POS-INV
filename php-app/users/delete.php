<?php
require_once __DIR__ . '/../includes/bootstrap.php';
$currentUser = require_role(['ADMIN']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect('users/index.php');
}
verify_csrf();

$id = (int) ($_POST['id'] ?? 0);

if ($id === (int) $currentUser['id']) {
    flash_set('error', 'You cannot delete your own account.');
    redirect('users/index.php');
}

$pdo = db();
$adminCount = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'ADMIN' AND is_active = 1")->fetchColumn();

$stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
$stmt->execute([$id]);
$target = $stmt->fetch();

if (!$target) {
    redirect('users/index.php');
}
if ($target['role'] === 'ADMIN' && (int) $target['is_active'] === 1 && $adminCount <= 1) {
    flash_set('error', 'Cannot delete the last active Owner/Admin.');
    redirect('users/index.php');
}

$stmt = $pdo->prepare('SELECT COUNT(*) FROM sales WHERE cashier_id = ?');
$stmt->execute([$id]);
$salesCount = (int) $stmt->fetchColumn();

if ($salesCount > 0) {
    $pdo->prepare('UPDATE users SET is_active = 0 WHERE id = ?')->execute([$id]);
    flash_set('success', 'User deactivated (has sales history, kept for reporting).');
} else {
    $pdo->prepare('DELETE FROM stock_movements WHERE user_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
    flash_set('success', 'User removed.');
}

redirect('users/index.php');
