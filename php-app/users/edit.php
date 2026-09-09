<?php
require_once __DIR__ . '/../includes/bootstrap.php';
$currentUser = require_role(['ADMIN']);

$id = (int) ($_GET['id'] ?? 0);
$stmt = db()->prepare('SELECT * FROM users WHERE id = ?');
$stmt->execute([$id]);
$target = $stmt->fetch();

if (!$target) {
    flash_set('error', 'User not found.');
    redirect('users/index.php');
}

$errors = [];
$values = $target;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $values['name'] = trim($_POST['name'] ?? '');
    $values['username'] = strtolower(trim($_POST['username'] ?? ''));
    $values['email'] = trim($_POST['email'] ?? '');
    $values['role'] = in_array($_POST['role'] ?? '', ['ADMIN', 'CASHIER'], true) ? $_POST['role'] : 'CASHIER';
    $values['is_active'] = isset($_POST['is_active']) ? 1 : 0;
    $password = (string) ($_POST['password'] ?? '');

    $isSelf = (int) $id === (int) $currentUser['id'];
    if ($values['name'] === '') $errors[] = 'Full name is required.';
    if (!preg_match('/^[a-zA-Z0-9._-]{3,50}$/', $values['username'])) $errors[] = 'Invalid username.';
    if ($isSelf && $values['role'] !== 'ADMIN') $errors[] = 'You cannot remove your own admin role.';
    if ($isSelf && !$values['is_active']) $errors[] = 'You cannot deactivate your own account.';
    if ($password !== '' && strlen($password) < 6) $errors[] = 'Password must be at least 6 characters.';

    if (!$errors) {
        try {
            if ($password !== '') {
                $stmt = db()->prepare('UPDATE users SET name=?, username=?, email=?, role=?, is_active=?, password_hash=? WHERE id=?');
                $stmt->execute([$values['name'], $values['username'], $values['email'] ?: null, $values['role'], $values['is_active'], password_hash($password, PASSWORD_BCRYPT), $id]);
            } else {
                $stmt = db()->prepare('UPDATE users SET name=?, username=?, email=?, role=?, is_active=? WHERE id=?');
                $stmt->execute([$values['name'], $values['username'], $values['email'] ?: null, $values['role'], $values['is_active'], $id]);
            }
            flash_set('success', 'User updated.');
            redirect('users/index.php');
        } catch (PDOException $e) {
            $errors[] = 'Username or email already exists.';
        }
    }
}

$pageTitle = 'Edit User';
require __DIR__ . '/../includes/header.php';
?>

<form method="post" class="card p-5" style="max-width:28rem">
  <?= csrf_field() ?>
  <?php foreach ($errors as $err): ?><p class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg" style="padding:0.5rem 0.75rem;margin-bottom:0.75rem"><?= e($err) ?></p><?php endforeach; ?>

  <div class="mb-3"><label class="label">Full Name *</label><input name="name" required class="input" value="<?= e($values['name']) ?>"></div>
  <div class="mb-3"><label class="label">Username *</label><input name="username" required class="input" value="<?= e($values['username']) ?>"></div>
  <div class="mb-3"><label class="label">Email</label><input type="email" name="email" class="input" value="<?= e($values['email'] ?? '') ?>"></div>
  <div class="mb-3"><label class="label">New Password (leave blank to keep)</label><input type="password" name="password" minlength="6" class="input"></div>
  <div class="mb-3">
    <label class="label">Role</label>
    <select name="role" class="input">
      <option value="CASHIER" <?= $values['role'] === 'CASHIER' ? 'selected' : '' ?>>Cashier</option>
      <option value="ADMIN" <?= $values['role'] === 'ADMIN' ? 'selected' : '' ?>>Owner / Admin</option>
    </select>
  </div>
  <label class="flex items-center gap-2 text-sm mb-4"><input type="checkbox" name="is_active" <?= $values['is_active'] ? 'checked' : '' ?>> Active</label>

  <div class="flex gap-3">
    <button type="submit" class="btn-primary">Save Changes</button>
    <a href="<?= url('users/index.php') ?>" class="btn-secondary">Cancel</a>
  </div>
</form>

<?php require __DIR__ . '/../includes/footer.php'; ?>
