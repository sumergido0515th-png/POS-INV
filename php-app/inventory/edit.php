<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_role(['ADMIN']);

$id = (int) ($_GET['id'] ?? 0);
$stmt = db()->prepare('SELECT * FROM products WHERE id = ?');
$stmt->execute([$id]);
$product = $stmt->fetch();

if (!$product) {
    flash_set('error', 'Product not found.');
    redirect('inventory/index.php');
}

$errors = [];
$values = $product;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    foreach (['sku', 'barcode', 'name', 'description', 'unit', 'cost_price', 'selling_price', 'reorder_level', 'category_id', 'brand_id', 'supplier_id'] as $key) {
        $values[$key] = trim($_POST[$key] ?? '');
    }
    $values['is_active'] = isset($_POST['is_active']) ? 1 : 0;

    if ($values['sku'] === '') $errors[] = 'SKU is required.';
    if ($values['name'] === '') $errors[] = 'Product name is required.';
    if ($values['category_id'] === '') $errors[] = 'Category is required.';
    if (!is_numeric($values['cost_price'])) $errors[] = 'Cost price must be a number.';
    if (!is_numeric($values['selling_price'])) $errors[] = 'Selling price must be a number.';

    if (!$errors) {
        try {
            $stmt = db()->prepare(
                'UPDATE products SET sku=?, barcode=?, name=?, description=?, unit=?, cost_price=?, selling_price=?, reorder_level=?, category_id=?, brand_id=?, supplier_id=?, is_active=? WHERE id=?'
            );
            $stmt->execute([
                $values['sku'], $values['barcode'] ?: null, $values['name'], $values['description'] ?: null,
                $values['unit'] ?: 'pc', (float) $values['cost_price'], (float) $values['selling_price'],
                (int) ($values['reorder_level'] ?: 5), (int) $values['category_id'], $values['brand_id'] ?: null,
                $values['supplier_id'] ?: null, $values['is_active'], $id,
            ]);
            flash_set('success', 'Product updated.');
            redirect('inventory/index.php');
        } catch (PDOException $e) {
            $errors[] = ($e->getCode() === '23000') ? 'SKU or barcode already exists.' : 'Failed to update product.';
        }
    }
}

$categories = db()->query('SELECT * FROM categories ORDER BY name')->fetchAll();
$brands = db()->query('SELECT * FROM brands ORDER BY name')->fetchAll();
$suppliers = db()->query('SELECT * FROM suppliers ORDER BY name')->fetchAll();

$movStmt = db()->prepare(
    'SELECT m.*, u.name AS user_name FROM stock_movements m JOIN users u ON u.id = m.user_id
     WHERE m.product_id = ? ORDER BY m.created_at DESC LIMIT 20'
);
$movStmt->execute([$id]);
$movements = $movStmt->fetchAll();

$movementLabels = [
    'RECEIVE' => 'Stock Received', 'ADJUSTMENT_IN' => 'Adjustment (+)', 'ADJUSTMENT_OUT' => 'Adjustment (-)',
    'SALE' => 'Sale', 'RETURN' => 'Return / Void',
];

$pageTitle = 'Edit Product';
require __DIR__ . '/../includes/header.php';
?>

<div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4" style="align-items:start">
  <form method="post" class="card p-5">
    <?= csrf_field() ?>
    <?php foreach ($errors as $err): ?>
      <p class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg" style="padding:0.5rem 0.75rem;margin-bottom:0.75rem"><?= e($err) ?></p>
    <?php endforeach; ?>

    <div class="grid grid-cols-2 gap-4 mb-4">
      <div><label class="label">SKU *</label><input name="sku" required class="input" value="<?= e($values['sku']) ?>"></div>
      <div><label class="label">Barcode</label><input name="barcode" class="input" value="<?= e($values['barcode'] ?? '') ?>"></div>
    </div>
    <div class="mb-4"><label class="label">Product Name *</label><input name="name" required class="input" value="<?= e($values['name']) ?>"></div>
    <div class="mb-4"><label class="label">Description</label><textarea name="description" rows="2" class="input"><?= e($values['description'] ?? '') ?></textarea></div>

    <div class="grid grid-cols-3 gap-4 mb-4">
      <div>
        <label class="label">Category *</label>
        <select name="category_id" required class="input">
          <?php foreach ($categories as $c): ?>
            <option value="<?= $c['id'] ?>" <?= (string) $values['category_id'] === (string) $c['id'] ? 'selected' : '' ?>><?= e($c['name']) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div>
        <label class="label">Brand</label>
        <select name="brand_id" class="input">
          <option value="">None</option>
          <?php foreach ($brands as $b): ?>
            <option value="<?= $b['id'] ?>" <?= (string) $values['brand_id'] === (string) $b['id'] ? 'selected' : '' ?>><?= e($b['name']) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div>
        <label class="label">Supplier</label>
        <select name="supplier_id" class="input">
          <option value="">None</option>
          <?php foreach ($suppliers as $s): ?>
            <option value="<?= $s['id'] ?>" <?= (string) $values['supplier_id'] === (string) $s['id'] ? 'selected' : '' ?>><?= e($s['name']) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-4">
      <div><label class="label">Unit</label><input name="unit" class="input" value="<?= e($values['unit']) ?>"></div>
      <div><label class="label">Cost Price *</label><input name="cost_price" type="number" step="0.01" min="0" required class="input" value="<?= e($values['cost_price']) ?>"></div>
      <div><label class="label">Selling Price *</label><input name="selling_price" type="number" step="0.01" min="0" required class="input" value="<?= e($values['selling_price']) ?>"></div>
    </div>
    <div class="mb-4" style="width:25%"><label class="label">Reorder Level</label><input name="reorder_level" type="number" min="0" class="input" value="<?= e($values['reorder_level']) ?>"></div>

    <label class="flex items-center gap-2 text-sm mb-4">
      <input type="checkbox" name="is_active" <?= $values['is_active'] ? 'checked' : '' ?>> Active (visible in POS)
    </label>

    <div class="flex gap-3">
      <button type="submit" class="btn-primary">Save Changes</button>
      <a href="<?= url('inventory/index.php') ?>" class="btn-secondary">Cancel</a>
    </div>
  </form>

  <div class="space-y-4">
    <form method="post" action="<?= url('inventory/stock_adjust.php') ?>" class="card p-4">
      <?= csrf_field() ?>
      <input type="hidden" name="product_id" value="<?= $id ?>">
      <h3 class="font-semibold text-ink-900 mb-3">Adjust Stock</h3>
      <p class="text-sm text-ink-500 mb-3">Current quantity: <span class="font-semibold text-ink-900"><?= (int) $product['quantity'] ?></span></p>

      <div class="mb-3">
        <label class="flex items-center gap-2 text-sm border border-ink-200 rounded-lg p-2 mb-1">
          <input type="radio" name="type" value="RECEIVE" checked> Stock Received
        </label>
        <label class="flex items-center gap-2 text-sm border border-ink-200 rounded-lg p-2 mb-1">
          <input type="radio" name="type" value="ADJUSTMENT_IN"> Adjustment (+)
        </label>
        <label class="flex items-center gap-2 text-sm border border-ink-200 rounded-lg p-2">
          <input type="radio" name="type" value="ADJUSTMENT_OUT"> Adjustment (-)
        </label>
      </div>
      <div class="mb-3"><label class="label">Quantity</label><input type="number" name="quantity" min="1" required class="input"></div>
      <div class="mb-3"><label class="label">Reason / Note</label><input name="reason" class="input" placeholder="e.g. Supplier delivery"></div>
      <button type="submit" class="btn-primary" style="width:100%">Apply</button>
    </form>

    <div class="card p-4">
      <h3 class="font-semibold text-ink-900 mb-3">Recent Stock Movements</h3>
      <div style="max-height:20rem;overflow-y:auto">
        <?php if (!$movements): ?>
          <p class="text-sm text-ink-400">No movements yet.</p>
        <?php endif; ?>
        <?php foreach ($movements as $m): $negative = in_array($m['type'], ['SALE', 'ADJUSTMENT_OUT'], true); ?>
          <div class="text-xs border-b border-ink-50" style="padding-bottom:0.5rem;margin-bottom:0.5rem">
            <div class="flex justify-between">
              <span class="font-medium" style="color:<?= $negative ? '#dc2626' : '#059669' ?>"><?= e($movementLabels[$m['type']]) ?></span>
              <span class="font-semibold"><?= $negative ? '-' : '+' ?><?= (int) $m['quantity'] ?></span>
            </div>
            <p class="text-ink-400"><?= format_date($m['created_at']) ?> &middot; <?= e($m['user_name']) ?></p>
            <?php if ($m['reason']): ?><p class="text-ink-500"><?= e($m['reason']) ?></p><?php endif; ?>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  </div>
</div>

<?php require __DIR__ . '/../includes/footer.php'; ?>
