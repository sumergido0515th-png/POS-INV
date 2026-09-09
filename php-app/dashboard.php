<?php
require_once __DIR__ . '/includes/bootstrap.php';
require_role(['ADMIN']);
require_once __DIR__ . '/includes/bar_chart.php';

$pdo = db();
$days = 14;
$since = date('Y-m-d 00:00:00', strtotime("-" . ($days - 1) . " days"));
$startOfToday = date('Y-m-d 00:00:00');

$stmt = $pdo->prepare("SELECT * FROM sales WHERE created_at >= ? AND status = 'COMPLETED' ORDER BY created_at ASC");
$stmt->execute([$since]);
$sales = $stmt->fetchAll();

$todayTotal = 0; $todayCount = 0; $rangeTotal = 0;
$byDay = [];
for ($i = 0; $i < $days; $i++) {
    $key = date('Y-m-d', strtotime("$since +$i days"));
    $byDay[$key] = 0.0;
}
foreach ($sales as $s) {
    $rangeTotal += (float) $s['total'];
    $day = substr($s['created_at'], 0, 10);
    if (isset($byDay[$day])) {
        $byDay[$day] += (float) $s['total'];
    }
    if ($s['created_at'] >= $startOfToday) {
        $todayTotal += (float) $s['total'];
        $todayCount++;
    }
}
$trend = [];
foreach ($byDay as $date => $value) {
    $trend[] = ['label' => $date, 'value' => $value];
}

// Top products in range
$saleIds = array_column($sales, 'id');
$topProducts = [];
if ($saleIds) {
    $placeholders = implode(',', array_fill(0, count($saleIds), '?'));
    $stmt = $pdo->prepare("SELECT product_name, sku, SUM(quantity) AS qty, SUM(line_total) AS revenue
                            FROM sale_items WHERE sale_id IN ($placeholders)
                            GROUP BY product_id, product_name, sku ORDER BY qty DESC LIMIT 8");
    $stmt->execute($saleIds);
    $topProducts = $stmt->fetchAll();
}

$products = $pdo->query('SELECT * FROM products WHERE is_active = 1')->fetchAll();
$lowStock = array_values(array_filter($products, fn($p) => $p['quantity'] <= $p['reorder_level']));
usort($lowStock, fn($a, $b) => $a['quantity'] <=> $b['quantity']);
$lowStock = array_slice($lowStock, 0, 20);
$inventoryValue = array_sum(array_map(fn($p) => $p['cost_price'] * $p['quantity'], $products));

$pageTitle = 'Dashboard';
require __DIR__ . '/includes/header.php';
?>

<div class="space-y-4">
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="card p-4">
      <p class="text-xs font-medium text-ink-500">Today's Sales</p>
      <p class="text-2xl font-bold text-ink-900 mt-1"><?= format_currency($todayTotal) ?></p>
      <p class="text-xs text-ink-400 mt-1"><?= $todayCount ?> transaction(s)</p>
    </div>
    <div class="card p-4">
      <p class="text-xs font-medium text-ink-500">Sales (<?= $days ?> days)</p>
      <p class="text-2xl font-bold text-ink-900 mt-1"><?= format_currency($rangeTotal) ?></p>
      <p class="text-xs text-ink-400 mt-1"><?= count($sales) ?> transaction(s)</p>
    </div>
    <div class="card p-4">
      <p class="text-xs font-medium text-ink-500">Low Stock Items</p>
      <p class="text-2xl font-bold mt-1" style="color:<?= count($lowStock) > 0 ? '#dc2626' : '#1a1e28' ?>"><?= count($lowStock) ?></p>
      <p class="text-xs text-ink-400 mt-1">At or below reorder level</p>
    </div>
    <div class="card p-4">
      <p class="text-xs font-medium text-ink-500">Inventory Value</p>
      <p class="text-2xl font-bold text-ink-900 mt-1"><?= format_currency($inventoryValue) ?></p>
      <p class="text-xs text-ink-400 mt-1"><?= count($products) ?> active products (at cost)</p>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div class="card p-4 lg:col-span-2">
      <h2 class="font-semibold text-ink-900 mb-4">Revenue — last <?= $days ?> days</h2>
      <?php render_bar_chart($trend); ?>
    </div>
    <div class="card p-4">
      <h2 class="font-semibold text-ink-900 mb-4">Top Products</h2>
      <?php if (!$topProducts): ?>
        <p class="text-sm text-ink-400">No sales in this period yet.</p>
      <?php endif; ?>
      <?php foreach ($topProducts as $p): ?>
        <div class="flex items-center justify-between" style="margin-bottom:0.75rem">
          <div class="min-w-0">
            <p class="text-sm font-medium text-ink-800 truncate"><?= e($p['product_name']) ?></p>
            <p class="text-xs text-ink-400"><?= e($p['sku']) ?></p>
          </div>
          <div class="text-right shrink-0" style="margin-left:0.75rem">
            <p class="font-semibold text-ink-900 text-sm"><?= (int) $p['qty'] ?> sold</p>
            <p class="text-xs text-ink-400"><?= format_currency($p['revenue']) ?></p>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  </div>

  <div class="card p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-semibold text-ink-900">Low Stock Alerts</h2>
      <a href="<?= url('inventory/index.php?low_stock=1') ?>" class="text-sm text-brand-600">View all in inventory &rarr;</a>
    </div>
    <?php if (!$lowStock): ?>
      <p class="text-sm text-ink-400">All products are sufficiently stocked.</p>
    <?php else: ?>
      <table class="data-table">
        <thead><tr><th>Product</th><th>SKU</th><th style="text-align:right">In Stock</th><th style="text-align:right">Reorder Level</th></tr></thead>
        <tbody>
          <?php foreach ($lowStock as $p): ?>
            <tr>
              <td><?= e($p['name']) ?></td>
              <td class="text-ink-500"><?= e($p['sku']) ?></td>
              <td style="text-align:right" class="font-semibold text-red-600"><?= (int) $p['quantity'] ?></td>
              <td style="text-align:right" class="text-ink-500"><?= (int) $p['reorder_level'] ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>
  </div>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
