<?php
/**
 * Shared authenticated-page header/shell. Include after require_login()/
 * require_role() and after setting $pageTitle. Closes with footer.php.
 */
$user = current_user();
$currentScript = basename($_SERVER['SCRIPT_NAME']);
$currentDir = basename(dirname($_SERVER['SCRIPT_NAME']));

function nav_active(string $dir, string $currentDir): string
{
    return $dir === $currentDir ? 'bg-brand-500 text-white' : 'text-ink-300 hover:bg-ink-900 hover:text-white';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= e($pageTitle ?? APP_NAME) ?> · <?= e(APP_NAME) ?></title>
<link rel="stylesheet" href="<?= url('assets/css/utilities.css') ?>">
<link rel="stylesheet" href="<?= url('assets/css/style.css') ?>">
</head>
<body class="bg-ink-50 text-ink-900 antialiased">
<div class="flex min-h-screen">
  <aside class="hidden md:flex w-60 shrink-0 flex-col bg-ink-950 text-ink-100 min-h-screen">
    <div class="flex items-center gap-2 px-5 py-5">
      <div class="h-9 w-9 rounded-xl bg-brand-500 flex items-center justify-center shrink-0 text-white font-bold">JP</div>
      <div class="leading-tight">
        <p class="font-semibold text-sm text-white">JP Laagan</p>
        <p class="text-[11px] text-ink-400">MotoPOS</p>
      </div>
    </div>
    <nav class="flex-1 px-3 space-y-1 mt-2 text-sm font-medium">
      <?php if ($user['role'] === 'ADMIN'): ?>
      <a href="<?= url('dashboard.php') ?>" class="flex items-center gap-3 rounded-lg px-3 py-2.5 <?= $currentScript === 'dashboard.php' ? 'bg-brand-500 text-white' : 'text-ink-300 hover:bg-ink-900 hover:text-white' ?>">Dashboard</a>
      <?php endif; ?>
      <a href="<?= url('pos/index.php') ?>" class="flex items-center gap-3 rounded-lg px-3 py-2.5 <?= nav_active('pos', $currentDir) ?>">Point of Sale</a>
      <?php if ($user['role'] === 'ADMIN'): ?>
      <a href="<?= url('inventory/index.php') ?>" class="flex items-center gap-3 rounded-lg px-3 py-2.5 <?= nav_active('inventory', $currentDir) ?>">Inventory</a>
      <?php endif; ?>
      <a href="<?= url('sales/index.php') ?>" class="flex items-center gap-3 rounded-lg px-3 py-2.5 <?= nav_active('sales', $currentDir) ?>">Sales History</a>
      <?php if ($user['role'] === 'ADMIN'): ?>
      <a href="<?= url('reports/index.php') ?>" class="flex items-center gap-3 rounded-lg px-3 py-2.5 <?= nav_active('reports', $currentDir) ?>">Reports</a>
      <a href="<?= url('users/index.php') ?>" class="flex items-center gap-3 rounded-lg px-3 py-2.5 <?= nav_active('users', $currentDir) ?>">Users</a>
      <a href="<?= url('settings/index.php') ?>" class="flex items-center gap-3 rounded-lg px-3 py-2.5 <?= nav_active('settings', $currentDir) ?>">Settings</a>
      <?php endif; ?>
    </nav>
    <div class="px-5 py-4 text-[11px] text-ink-500">v1.0 (PHP) · Motorcycle Parts</div>
  </aside>

  <div class="flex-1 min-w-0 flex flex-col">
    <header class="sticky top-0 z-20 flex items-center justify-between border-b border-ink-100 bg-white/80 backdrop-blur px-4 md:px-6 py-3">
      <h1 class="text-lg font-semibold text-ink-900"><?= e($pageTitle ?? '') ?></h1>
      <div class="flex items-center gap-3">
        <div class="text-right hidden sm:block">
          <p class="text-sm font-medium text-ink-900 leading-tight"><?= e($user['name']) ?></p>
          <p class="text-xs text-ink-500 leading-tight"><?= $user['role'] === 'ADMIN' ? 'Owner / Admin' : 'Cashier' ?></p>
        </div>
        <a href="<?= url('auth/logout.php') ?>" class="btn-ghost p-2" title="Sign out">&#8677;</a>
      </div>
    </header>
    <main class="flex-1 p-4 md:p-6">
      <?php $flash = flash_get(); if ($flash): ?>
        <div class="mb-4 rounded-lg px-4 py-3 text-sm <?= $flash['type'] === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100' ?>">
          <?= e($flash['message']) ?>
        </div>
      <?php endif; ?>
