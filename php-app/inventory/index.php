<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_role(['ADMIN']);

$q = trim($_GET['q'] ?? '');
$lowStockOnly = ($_GET['low_stock'] ?? '') === '1';
$showInactive = ($_GET['show_inactive'] ?? '') === '1';

$sql = 'SELECT p.*, c.name AS category_name, b.name AS brand_name
        FROM products p
        JOIN categories c ON c.id = p.category_id
        LEFT JOIN brands b ON b.id = p.brand_id
        WHERE 1=1';
$params = [];
if (!$showInactive) {
    $sql .= ' AND p.is_active = 1';
}
if ($q !== '') {
    $sql .= ' AND (p.name LIKE ? OR p.sku LIKE ?)';
    $params[] = "%$q%";
    $params[] = "%$q%";
}
if ($lowStockOnly) {
    $sql .= ' AND p.quantity <= p.reorder_level';
}
$sql .= ' ORDER BY p.name ASC';

$stmt = db()->prepare($sql);
$stmt->execute($params);
$products = $stmt->fetchAll();

$pageTitle = 'Inventory';
require __DIR__ . '/../includes/header.php';
?>

<div class="space-y-4">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <form method="get" class="flex flex-col sm:flex-row gap-2 flex-1 items-center">
      <input type="text" name="q" value="<?= e($q) ?>" placeholder="Search products..." class="input" style="max-width:20rem">
      <label class="flex items-center gap-2 text-sm text-ink-600 shrink-0">
        <input type="checkbox" name="low_stock" value="1" <?= $lowStockOnly ? 'checked' : '' ?> onchange="this.form.submit()"> Low stock only
      </label>
      <label class="flex items-center gap-2 text-sm text-ink-600 shrink-0">
        <input type="checkbox" name="show_inactive" value="1" <?= $showInactive ? 'checked' : '' ?> onchange="this.form.submit()"> Show inactive
      </label>
      <button type="submit" class="btn-secondary">Filter</button>
    </form>
    <div class="flex gap-2 shrink-0">
      <a href="<?= url('inventory/catalog.php') ?>" class="btn-secondary">Categories &amp; Brands</a>
      <a href="<?= url('inventory/new.php') ?>" class="btn-primary">+ Add Product</a>
    </div>
  </div>

  <div class="card" style="overflow-x:auto">
    <table class="data-table">
      <thead>
        <tr>
          <th>Product</th><th>Category</th><th>Brand</th>
          <th style="text-align:right">Cost</th><th style="text-align:right">Price</th>
          <th style="text-align:right">Stock</th><th>Status</th><th style="text-align:right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php if (!$products): ?>
          <tr><td colspan="8" class="text-center text-ink-400" style="padding:2rem">No products found.</td></tr>
        <?php endif; ?>
        <?php foreach ($products as $p): $low = $p['quantity'] <= $p['reorder_level']; ?>
          <tr>
            <td>
              <p class="font-medium text-ink-900"><?= e($p['name']) ?></p>
              <p class="text-xs text-ink-400"><?= e($p['sku']) ?></p>
            </td>
            <td><?= e($p['category_name']) ?></td>
            <td><?= e($p['brand_name'] ?? '—') ?></td>
            <td style="text-align:right"><?= format_currency($p['cost_price']) ?></td>
            <td style="text-align:right" class="font-medium"><?= format_currency($p['selling_price']) ?></td>
            <td style="text-align:right">
              <span class="<?= $low ? 'text-red-600 font-semibold' : '' ?>"><?= (int) $p['quantity'] ?></span>
              <span class="text-ink-400"> <?= e($p['unit']) ?></span>
            </td>
            <td>
              <?php if (!$p['is_active']): ?>
                <span class="badge bg-ink-100 text-ink-600">Inactive</span>
              <?php elseif ($low): ?>
                <span class="badge bg-amber-100 text-amber-700">Low stock</span>
              <?php else: ?>
                <span class="badge bg-emerald-100 text-emerald-700">In stock</span>
              <?php endif; ?>
            </td>
            <td style="text-align:right">
              <a href="<?= url('inventory/edit.php?id=' . $p['id']) ?>" class="btn-ghost" style="padding:0.4rem 0.6rem">Edit</a>
              <form method="post" action="<?= url('inventory/delete.php') ?>" style="display:inline" onsubmit="return confirm('Delete this product?');">
                <?= csrf_field() ?>
                <input type="hidden" name="id" value="<?= (int) $p['id'] ?>">
                <button type="submit" class="btn-ghost" style="padding:0.4rem 0.6rem;color:#dc2626">Delete</button>
              </form>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<?php require __DIR__ . '/../includes/footer.php'; ?>
