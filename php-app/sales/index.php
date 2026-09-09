<?php
require_once __DIR__ . '/../includes/bootstrap.php';
$user = require_login();

$q = trim($_GET['q'] ?? '');
$from = $_GET['from'] ?? '';
$to = $_GET['to'] ?? '';

$sql = 'SELECT s.*, u.name AS cashier_name, (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS item_count
        FROM sales s JOIN users u ON u.id = s.cashier_id WHERE 1=1';
$params = [];

if ($user['role'] !== 'ADMIN') {
    $sql .= ' AND s.cashier_id = ?';
    $params[] = $user['id'];
}
if ($q !== '') {
    $sql .= ' AND s.invoice_no LIKE ?';
    $params[] = "%$q%";
}
if ($from !== '') {
    $sql .= ' AND s.created_at >= ?';
    $params[] = $from . ' 00:00:00';
}
if ($to !== '') {
    $sql .= ' AND s.created_at <= ?';
    $params[] = $to . ' 23:59:59';
}
$sql .= ' ORDER BY s.created_at DESC LIMIT 200';

$stmt = db()->prepare($sql);
$stmt->execute($params);
$sales = $stmt->fetchAll();

$total = 0;
foreach ($sales as $s) {
    if ($s['status'] === 'COMPLETED') $total += (float) $s['total'];
}

$paymentLabels = ['CASH' => 'Cash', 'GCASH' => 'GCash', 'CARD' => 'Card', 'BANK_TRANSFER' => 'Bank Transfer'];

$pageTitle = 'Sales History';
require __DIR__ . '/../includes/header.php';
?>

<div class="space-y-4">
  <form method="get" class="flex flex-wrap gap-2" style="align-items:flex-end">
    <div><label class="label">Invoice no.</label><input name="q" value="<?= e($q) ?>" class="input" style="width:12rem"></div>
    <div><label class="label">From</label><input type="date" name="from" value="<?= e($from) ?>" class="input"></div>
    <div><label class="label">To</label><input type="date" name="to" value="<?= e($to) ?>" class="input"></div>
    <button type="submit" class="btn-secondary">Filter</button>
    <div style="margin-left:auto;text-align:right">
      <p class="text-xs text-ink-500">Total (filtered)</p>
      <p class="text-lg font-bold text-ink-900"><?= format_currency($total) ?></p>
    </div>
  </form>

  <div class="card" style="overflow-x:auto">
    <table class="data-table">
      <thead>
        <tr><th>Invoice</th><th>Date</th><th>Cashier</th><th>Items</th><th>Payment</th><th style="text-align:right">Total</th><th>Status</th><th style="text-align:right">Actions</th></tr>
      </thead>
      <tbody>
        <?php if (!$sales): ?><tr><td colspan="8" class="text-center text-ink-400" style="padding:2rem">No sales found.</td></tr><?php endif; ?>
        <?php foreach ($sales as $s): ?>
          <tr>
            <td class="font-medium text-ink-900"><?= e($s['invoice_no']) ?></td>
            <td class="text-ink-600"><?= format_date($s['created_at']) ?></td>
            <td class="text-ink-600"><?= e($s['cashier_name']) ?></td>
            <td class="text-ink-600"><?= (int) $s['item_count'] ?></td>
            <td class="text-ink-600"><?= $paymentLabels[$s['payment_method']] ?></td>
            <td style="text-align:right" class="font-semibold text-ink-900"><?= format_currency($s['total']) ?></td>
            <td>
              <span class="badge <?= $s['status'] === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700' ?>"><?= $s['status'] ?></span>
            </td>
            <td style="text-align:right"><a href="<?= url('sales/view.php?id=' . $s['id']) ?>" class="btn-ghost" style="padding:0.4rem 0.6rem">View</a></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<?php require __DIR__ . '/../includes/footer.php'; ?>
