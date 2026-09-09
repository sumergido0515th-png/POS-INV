<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_role(['ADMIN']);
require_once __DIR__ . '/../includes/bar_chart.php';

$days = (int) ($_GET['days'] ?? 30);
if (!in_array($days, [7, 14, 30, 90], true)) {
    $days = 30;
}

$pdo = db();
$since = date('Y-m-d 00:00:00', strtotime("-" . ($days - 1) . " days"));

$stmt = $pdo->prepare("SELECT * FROM sales WHERE created_at >= ? AND status = 'COMPLETED' ORDER BY created_at ASC");
$stmt->execute([$since]);
$sales = $stmt->fetchAll();

$rangeTotal = array_sum(array_map(fn($s) => (float) $s['total'], $sales));

$byDay = [];
for ($i = 0; $i < $days; $i++) {
    $byDay[date('Y-m-d', strtotime("$since +$i days"))] = 0.0;
}
foreach ($sales as $s) {
    $day = substr($s['created_at'], 0, 10);
    if (isset($byDay[$day])) $byDay[$day] += (float) $s['total'];
}
$trend = [];
foreach ($byDay as $date => $value) $trend[] = ['label' => $date, 'value' => $value];

$saleIds = array_column($sales, 'id');
$topProducts = [];
if ($saleIds) {
    $placeholders = implode(',', array_fill(0, count($saleIds), '?'));
    $stmt = $pdo->prepare("SELECT product_name, sku, SUM(quantity) AS qty, SUM(line_total) AS revenue
                            FROM sale_items WHERE sale_id IN ($placeholders)
                            GROUP BY product_id, product_name, sku ORDER BY qty DESC LIMIT 15");
    $stmt->execute($saleIds);
    $topProducts = $stmt->fetchAll();
}

$products = $pdo->query('SELECT * FROM products WHERE is_active = 1')->fetchAll();
$lowStock = array_values(array_filter($products, fn($p) => $p['quantity'] <= $p['reorder_level']));
usort($lowStock, fn($a, $b) => $a['quantity'] <=> $b['quantity']);
$inventoryValue = array_sum(array_map(fn($p) => $p['cost_price'] * $p['quantity'], $products));

$pageTitle = 'Reports';
require __DIR__ . '/../includes/header.php';
?>

<div class="space-y-4">
  <div class="flex items-center gap-2">
    <span class="text-sm text-ink-500">Range:</span>
    <?php foreach ([7, 14, 30, 90] as $d): ?>
      <a href="?days=<?= $d ?>" class="badge" style="border:1px solid <?= $days === $d ? '#f9490c' : '#d5d9e2' ?>; background:<?= $days === $d ? '#f9490c' : '#fff' ?>; color:<?= $days === $d ? '#fff' : '#4f5b73' ?>"><?= $d ?> days</a>
    <?php endforeach; ?>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div class="card p-4"><p class="text-xs text-ink-500">Total Revenue</p><p class="text-2xl font-bold text-ink-900"><?= format_currency($rangeTotal) ?></p></div>
    <div class="card p-4"><p class="text-xs text-ink-500">Transactions</p><p class="text-2xl font-bold text-ink-900"><?= count($sales) ?></p></div>
    <div class="card p-4"><p class="text-xs text-ink-500">Inventory Value (cost)</p><p class="text-2xl font-bold text-ink-900"><?= format_currency($inventoryValue) ?></p></div>
  </div>

  <div class="card p-4">
    <h2 class="font-semibold text-ink-900 mb-4">Sales Volume by Day</h2>
    <?php render_bar_chart($trend); ?>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div class="card p-4">
      <h2 class="font-semibold text-ink-900 mb-3">Best Sellers</h2>
      <table class="data-table">
        <thead><tr><th>Product</th><th style="text-align:right">Qty Sold</th><th style="text-align:right">Revenue</th></tr></thead>
        <tbody>
          <?php foreach ($topProducts as $p): ?>
            <tr><td><?= e($p['product_name']) ?></td><td style="text-align:right"><?= (int) $p['qty'] ?></td><td style="text-align:right" class="font-medium"><?= format_currency($p['revenue']) ?></td></tr>
          <?php endforeach; ?>
          <?php if (!$topProducts): ?><tr><td colspan="3" class="text-center text-ink-400" style="padding:1rem">No sales in this range.</td></tr><?php endif; ?>
        </tbody>
      </table>
    </div>
    <div class="card p-4">
      <h2 class="font-semibold text-ink-900 mb-3">Low Stock</h2>
      <table class="data-table">
        <thead><tr><th>Product</th><th style="text-align:right">Stock</th><th style="text-align:right">Reorder At</th></tr></thead>
        <tbody>
          <?php foreach (array_slice($lowStock, 0, 20) as $p): ?>
            <tr><td><?= e($p['name']) ?></td><td style="text-align:right" class="font-semibold text-red-600"><?= (int) $p['quantity'] ?></td><td style="text-align:right" class="text-ink-500"><?= (int) $p['reorder_level'] ?></td></tr>
          <?php endforeach; ?>
          <?php if (!$lowStock): ?><tr><td colspan="3" class="text-center text-ink-400" style="padding:1rem">All stocked up.</td></tr><?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<?php require __DIR__ . '/../includes/footer.php'; ?>
