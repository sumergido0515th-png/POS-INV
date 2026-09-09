<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_role(['ADMIN']);

$settings = db()->query('SELECT * FROM settings ORDER BY id LIMIT 1')->fetch();
if (!$settings) {
    db()->exec('INSERT INTO settings (business_name) VALUES (\'JP Laagan MotoPOS\')');
    $settings = db()->query('SELECT * FROM settings ORDER BY id LIMIT 1')->fetch();
}

$errors = [];
$values = $settings;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    foreach (['business_name', 'address', 'phone', 'email', 'tax_rate', 'currency', 'receipt_footer', 'low_stock_threshold'] as $key) {
        $values[$key] = trim($_POST[$key] ?? '');
    }

    if ($values['business_name'] === '') $errors[] = 'Business name is required.';
    if (!is_numeric($values['tax_rate'])) $errors[] = 'Tax rate must be a number.';

    if (!$errors) {
        $stmt = db()->prepare('UPDATE settings SET business_name=?, address=?, phone=?, email=?, tax_rate=?, currency=?, receipt_footer=?, low_stock_threshold=? WHERE id=?');
        $stmt->execute([
            $values['business_name'], $values['address'] ?: null, $values['phone'] ?: null, $values['email'] ?: null,
            (float) $values['tax_rate'], $values['currency'] ?: 'PHP', $values['receipt_footer'] ?: null,
            (int) ($values['low_stock_threshold'] ?: 5), $settings['id'],
        ]);
        flash_set('success', 'Settings saved.');
        redirect('settings/index.php');
    }
}

$pageTitle = 'Settings';
require __DIR__ . '/../includes/header.php';
?>

<form method="post" class="card p-5" style="max-width:36rem">
  <?= csrf_field() ?>
  <?php foreach ($errors as $err): ?><p class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg" style="padding:0.5rem 0.75rem;margin-bottom:0.75rem"><?= e($err) ?></p><?php endforeach; ?>

  <h2 class="font-semibold text-ink-900 mb-3">Business Information</h2>
  <div class="mb-3"><label class="label">Business Name</label><input name="business_name" required class="input" value="<?= e($values['business_name']) ?>"></div>
  <div class="mb-3"><label class="label">Address</label><input name="address" class="input" value="<?= e($values['address'] ?? '') ?>"></div>
  <div class="grid grid-cols-2 gap-4 mb-3">
    <div><label class="label">Phone</label><input name="phone" class="input" value="<?= e($values['phone'] ?? '') ?>"></div>
    <div><label class="label">Email</label><input type="email" name="email" class="input" value="<?= e($values['email'] ?? '') ?>"></div>
  </div>

  <hr style="border-color:#eceef2;margin:1.25rem 0">
  <h2 class="font-semibold text-ink-900 mb-3">Sales Configuration</h2>
  <div class="grid grid-cols-2 gap-4 mb-3">
    <div><label class="label">Tax Rate (%)</label><input type="number" step="0.01" min="0" name="tax_rate" class="input" value="<?= e($values['tax_rate']) ?>"></div>
    <div><label class="label">Currency</label><input name="currency" class="input" value="<?= e($values['currency']) ?>"></div>
  </div>
  <div class="mb-3"><label class="label">Default Low Stock Threshold</label><input type="number" min="0" name="low_stock_threshold" class="input" value="<?= e($values['low_stock_threshold']) ?>"></div>
  <div class="mb-4"><label class="label">Receipt Footer</label><textarea name="receipt_footer" rows="2" class="input"><?= e($values['receipt_footer'] ?? '') ?></textarea></div>

  <button type="submit" class="btn-primary">Save Settings</button>
</form>

<?php require __DIR__ . '/../includes/footer.php'; ?>
