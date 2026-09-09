<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_role(['ADMIN']);

$errors = [];
$values = [
    'sku' => '', 'barcode' => '', 'name' => '', 'description' => '', 'unit' => 'pc',
    'cost_price' => '', 'selling_price' => '', 'quantity' => '0', 'reorder_level' => '5',
    'category_id' => '', 'brand_id' => '', 'supplier_id' => '',
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    foreach ($values as $key => $_) {
        $values[$key] = trim($_POST[$key] ?? '');
    }

    if ($values['sku'] === '') $errors[] = 'SKU is required.';
    if ($values['name'] === '') $errors[] = 'Product name is required.';
    if ($values['category_id'] === '') $errors[] = 'Category is required.';
    if ($values['cost_price'] === '' || !is_numeric($values['cost_price'])) $errors[] = 'Cost price must be a number.';
    if ($values['selling_price'] === '' || !is_numeric($values['selling_price'])) $errors[] = 'Selling price must be a number.';

    if (!$errors) {
        try {
            $pdo = db();
            $pdo->beginTransaction();
            $stmt = $pdo->prepare(
                'INSERT INTO products (sku, barcode, name, description, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $values['sku'],
                $values['barcode'] ?: null,
                $values['name'],
                $values['description'] ?: null,
                $values['unit'] ?: 'pc',
                (float) $values['cost_price'],
                (float) $values['selling_price'],
                (int) $values['quantity'],
                (int) ($values['reorder_level'] ?: 5),
                (int) $values['category_id'],
                $values['brand_id'] ?: null,
                $values['supplier_id'] ?: null,
            ]);
            $productId = $pdo->lastInsertId();

            if ((int) $values['quantity'] > 0) {
                $pdo->prepare(
                    "INSERT INTO stock_movements (product_id, type, quantity, reason, user_id) VALUES (?, 'RECEIVE', ?, 'Initial stock on product creation', ?)"
                )->execute([$productId, (int) $values['quantity'], current_user()['id']]);
            }

            $pdo->commit();
            flash_set('success', 'Product created.');
            redirect('inventory/index.php');
        } catch (PDOException $e) {
            $pdo->rollBack();
            $errors[] = ($e->getCode() === '23000') ? 'SKU or barcode already exists.' : 'Failed to create product.';
        }
    }
}

$categories = db()->query('SELECT * FROM categories ORDER BY name')->fetchAll();
$brands = db()->query('SELECT * FROM brands ORDER BY name')->fetchAll();
$suppliers = db()->query('SELECT * FROM suppliers ORDER BY name')->fetchAll();

$pageTitle = 'Add Product';
require __DIR__ . '/../includes/header.php';
?>

<form method="post" class="card p-5" style="max-width:48rem">
  <?= csrf_field() ?>
  <?php foreach ($errors as $err): ?>
    <p class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg" style="padding:0.5rem 0.75rem;margin-bottom:0.75rem"><?= e($err) ?></p>
  <?php endforeach; ?>

  <div class="grid grid-cols-2 gap-4 mb-4">
    <div>
      <label class="label">SKU *</label>
      <input name="sku" required class="input" value="<?= e($values['sku']) ?>">
    </div>
    <div>
      <label class="label">Barcode</label>
      <input name="barcode" class="input" value="<?= e($values['barcode']) ?>">
    </div>
  </div>

  <div class="mb-4">
    <label class="label">Product Name *</label>
    <input name="name" required class="input" value="<?= e($values['name']) ?>">
  </div>

  <div class="mb-4">
    <label class="label">Description</label>
    <textarea name="description" rows="2" class="input"><?= e($values['description']) ?></textarea>
  </div>

  <div class="grid grid-cols-3 gap-4 mb-4">
    <div>
      <label class="label">Category *</label>
      <select name="category_id" required class="input">
        <option value="">Select...</option>
        <?php foreach ($categories as $c): ?>
          <option value="<?= $c['id'] ?>" <?= (string) $values['category_id'] === (string) $c['id'] ? 'selected' : '' ?>><?= e($c['name']) ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div>
      <label class="label">Brand / Compatibility</label>
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

  <div class="grid grid-cols-4 gap-4 mb-4">
    <div>
      <label class="label">Unit</label>
      <input name="unit" class="input" value="<?= e($values['unit']) ?>">
    </div>
    <div>
      <label class="label">Cost Price *</label>
      <input name="cost_price" type="number" step="0.01" min="0" required class="input" value="<?= e($values['cost_price']) ?>">
    </div>
    <div>
      <label class="label">Selling Price *</label>
      <input name="selling_price" type="number" step="0.01" min="0" required class="input" value="<?= e($values['selling_price']) ?>">
    </div>
    <div>
      <label class="label">Reorder Level</label>
      <input name="reorder_level" type="number" min="0" class="input" value="<?= e($values['reorder_level']) ?>">
    </div>
  </div>

  <div class="mb-4" style="width:25%">
    <label class="label">Initial Quantity</label>
    <input name="quantity" type="number" min="0" class="input" value="<?= e($values['quantity']) ?>">
    <p class="text-xs text-ink-400 mt-1">Use Stock Adjustments later to change quantity — keeps history accurate.</p>
  </div>

  <div class="flex gap-3">
    <button type="submit" class="btn-primary">Create Product</button>
    <a href="<?= url('inventory/index.php') ?>" class="btn-secondary">Cancel</a>
  </div>
</form>

<?php require __DIR__ . '/../includes/footer.php'; ?>
