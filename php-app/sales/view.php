<?php
require_once __DIR__ . '/../includes/bootstrap.php';
$user = require_login();

$id = (int) ($_GET['id'] ?? 0);
$stmt = db()->prepare('SELECT s.*, u.name AS cashier_name FROM sales s JOIN users u ON u.id = s.cashier_id WHERE s.id = ?');
$stmt->execute([$id]);
$sale = $stmt->fetch();

if (!$sale || ($user['role'] !== 'ADMIN' && (int) $sale['cashier_id'] !== (int) $user['id'])) {
    flash_set('error', 'Sale not found.');
    redirect('sales/index.php');
}

$itemsStmt = db()->prepare('SELECT * FROM sale_items WHERE sale_id = ?');
$itemsStmt->execute([$id]);
$items = $itemsStmt->fetchAll();

$paymentLabels = ['CASH' => 'Cash', 'GCASH' => 'GCash', 'CARD' => 'Card', 'BANK_TRANSFER' => 'Bank Transfer'];

$pageTitle = 'Sale ' . $sale['invoice_no'];
require __DIR__ . '/../includes/header.php';
?>

<div style="max-width:42rem" class="space-y-4">
  <div class="flex items-center gap-3">
    <a href="<?= url('sales/index.php') ?>" class="text-sm text-ink-500">&larr;</a>
    <h1 class="text-xl font-semibold text-ink-900">Sale <?= e($sale['invoice_no']) ?></h1>
    <span class="badge <?= $sale['status'] === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700' ?>" style="margin-left:auto"><?= $sale['status'] ?></span>
  </div>

  <div class="card p-5 space-y-4">
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div><p class="text-ink-400">Date</p><p class="font-medium text-ink-900"><?= format_date($sale['created_at']) ?></p></div>
      <div><p class="text-ink-400">Cashier</p><p class="font-medium text-ink-900"><?= e($sale['cashier_name']) ?></p></div>
      <div><p class="text-ink-400">Payment Method</p><p class="font-medium text-ink-900"><?= $paymentLabels[$sale['payment_method']] ?></p></div>
      <?php if ($sale['customer_name']): ?>
        <div><p class="text-ink-400">Customer</p><p class="font-medium text-ink-900"><?= e($sale['customer_name']) ?><?= $sale['customer_phone'] ? ' · ' . e($sale['customer_phone']) : '' ?></p></div>
      <?php endif; ?>
    </div>

    <table class="data-table">
      <thead><tr><th>Item</th><th style="text-align:right">Price</th><th style="text-align:right">Qty</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>
        <?php foreach ($items as $item): ?>
          <tr>
            <td><?= e($item['product_name']) ?><span class="text-ink-400 text-xs" style="display:block"><?= e($item['sku']) ?></span></td>
            <td style="text-align:right" class="text-ink-600"><?= format_currency($item['unit_price']) ?></td>
            <td style="text-align:right" class="text-ink-600"><?= (int) $item['quantity'] ?></td>
            <td style="text-align:right" class="font-medium text-ink-900"><?= format_currency($item['line_total']) ?></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>

    <div class="space-y-1 text-sm" style="margin-left:auto;max-width:20rem">
      <div class="flex justify-between"><span class="text-ink-500">Subtotal</span><span><?= format_currency($sale['subtotal']) ?></span></div>
      <div class="flex justify-between"><span class="text-ink-500">Discount</span><span>-<?= format_currency($sale['discount']) ?></span></div>
      <div class="flex justify-between"><span class="text-ink-500">Tax</span><span><?= format_currency($sale['tax']) ?></span></div>
      <div class="flex justify-between font-bold text-base border-t border-ink-100" style="padding-top:0.25rem"><span>Total</span><span><?= format_currency($sale['total']) ?></span></div>
      <div class="flex justify-between text-ink-500"><span>Paid</span><span><?= format_currency($sale['amount_paid']) ?></span></div>
      <div class="flex justify-between text-ink-500"><span>Change</span><span><?= format_currency($sale['change_due']) ?></span></div>
    </div>

    <?php if ($user['role'] === 'ADMIN' && $sale['status'] === 'COMPLETED'): ?>
      <form method="post" action="<?= url('sales/void.php') ?>" onsubmit="return confirm('Void this sale? Stock will be restored.');">
        <?= csrf_field() ?>
        <input type="hidden" name="id" value="<?= $id ?>">
        <button type="submit" class="btn-danger">Void Sale</button>
      </form>
    <?php endif; ?>
  </div>
</div>

<?php require __DIR__ . '/../includes/footer.php'; ?>
