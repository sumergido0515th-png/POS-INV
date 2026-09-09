<?php
require_once __DIR__ . '/../includes/bootstrap.php';

if (is_logged_in()) {
    redirect('index.php');
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $username = trim($_POST['username'] ?? '');
    $password = (string) ($_POST['password'] ?? '');

    if ($username === '' || $password === '') {
        $error = 'Please enter your username and password.';
    } elseif (attempt_login($username, $password)) {
        redirect('index.php');
    } else {
        $error = 'Invalid username or password.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sign in · <?= e(APP_NAME) ?></title>
<link rel="stylesheet" href="<?= url('assets/css/utilities.css') ?>">
<link rel="stylesheet" href="<?= url('assets/css/style.css') ?>">
</head>
<body class="min-h-screen flex items-center justify-center bg-gradient-to-br from-ink-950 via-ink-900 to-red-950 px-4">
  <div class="w-full max-w-sm">
    <div class="flex flex-col items-center mb-8">
      <div class="h-14 w-14 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg mb-4 text-white text-xl font-bold">JP</div>
      <h1 class="text-2xl font-bold text-white tracking-tight"><?= e(APP_NAME) ?></h1>
      <p class="text-ink-400 text-sm mt-1">Motorcycle Parts POS &amp; Inventory (PHP edition)</p>
    </div>

    <form method="post" class="bg-white rounded-2xl p-6 space-y-4 shadow-xl">
      <?= csrf_field() ?>
      <div>
        <label class="block text-sm font-medium text-ink-900 mb-1" for="username">Username</label>
        <input id="username" name="username" class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm" autocomplete="username" required autofocus>
      </div>
      <div>
        <label class="block text-sm font-medium text-ink-900 mb-1" for="password">Password</label>
        <input id="password" type="password" name="password" class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm" autocomplete="current-password" required>
      </div>

      <?php if ($error): ?>
        <p class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"><?= e($error) ?></p>
      <?php endif; ?>

      <button type="submit" class="w-full rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium py-2.5">Sign in</button>
    </form>

    <p class="text-center text-xs text-ink-400 mt-6">
      Demo — Owner/Admin: <span class="text-ink-200">admin / admin123</span> &middot;
      Cashier: <span class="text-ink-200">cashier / cashier123</span>
    </p>
  </div>
</body>
</html>
