<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_role(['ADMIN']);

$errors = [];
$values = ['name' => '', 'username' => '', 'email' => '', 'role' => 'CASHIER', 'is_active' => 1];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $values['name'] = trim($_POST['name'] ?? '');
    $values['username'] = strtolower(trim($_POST['username'] ?? ''));
    $values['email'] = trim($_POST['email'] ?? '');
    $values['role'] = in_array($_POST['role'] ?? '', ['ADMIN', 'CASHIER'], true) ? $_POST['role'] : 'CASHIER';
    $values['is_active'] = isset($_POST['is_active']) ? 1 : 0;
    $password = (string) ($_POST['password'] ?? '');

    if ($values['name'] === '') $errors[] = 'Full name is required.';
    if (!preg_match('/^[a-zA-Z0-9._-]{3,50}$/', $values['username'])) $errors[] = 'Username must be 3-50 characters (letters, numbers, dot, underscore, dash).';
    if (strlen($password) < 6) $errors[] = 'Password must be at least 6 characters.';

    if (!$errors) {
        try {
            $stmt = db()->prepare('INSERT INTO users (name, username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?)');
            $stmt->execute([$values['name'], $values['username'], $values['email'] ?: null, password_hash($password, PASSWORD_BCRYPT), $values['role'], $values['is_active']]);
            flash_set('success', 'User created.');
            redirect('users/index.php');
        } catch (PDOException $e) {
            $errors[] = 'Username or email already exists.';
        }
    }
}

$pageTitle = 'Add User';
require __DIR__ . '/../includes/header.php';
?>

<form method="post" class="card p-5" style="max-width:28rem">
  <?= csrf_field() ?>
  <?php foreach ($errors as $err): ?><p class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg" style="padding:0.5rem 0.75rem;margin-bottom:0.75rem"><?= e($err) ?></p><?php endforeach; ?>

  <div class="mb-3"><label class="label">Full Name *</label><input name="name" required class="input" value="<?= e($values['name']) ?>"></div>
  <div class="mb-3"><label class="label">Username *</label><input name="username" required class="input" value="<?= e($values['username']) ?>"></div>
  <div class="mb-3"><label class="label">Email</label><input type="email" name="email" class="input" value="<?= e($values['email']) ?>"></div>
  <div class="mb-3"><label class="label">Password *</label><input type="password" name="password" required minlength="6" class="input"></div>
  <div class="mb-3">
    <label class="label">Role</label>
    <select name="role" class="input">
      <option value="CASHIER" <?= $values['role'] === 'CASHIER' ? 'selected' : '' ?>>Cashier</option>
      <option value="ADMIN" <?= $values['role'] === 'ADMIN' ? 'selected' : '' ?>>Owner / Admin</option>
    </select>
  </div>
  <label class="flex items-center gap-2 text-sm mb-4"><input type="checkbox" name="is_active" <?= $values['is_active'] ? 'checked' : '' ?>> Active</label>

  <div class="flex gap-3">
    <button type="submit" class="btn-primary">Create User</button>
    <a href="<?= url('users/index.php') ?>" class="btn-secondary">Cancel</a>
  </div>
</form>

<?php require __DIR__ . '/../includes/footer.php'; ?>
