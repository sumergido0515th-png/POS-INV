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
      <div class="flex items-center gap-3">
        <button
          type="button"
          onclick="openMobileNav()"
          class="flex md:hidden btn-ghost"
          style="padding:0.6rem; min-width:44px; min-height:44px;"
          aria-label="Open navigation menu"
          aria-controls="mobileNavOverlay"
          aria-expanded="false"
        >
          <span aria-hidden="true" style="font-size:1.25rem; line-height:1;">&#9776;</span>
        </button>
        <h1 class="text-lg font-semibold text-ink-900"><?= e($pageTitle ?? '') ?></h1>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-right hidden sm:block">
          <p class="text-sm font-medium text-ink-900 leading-tight"><?= e($user['name']) ?></p>
          <p class="text-xs text-ink-500 leading-tight"><?= $user['role'] === 'ADMIN' ? 'Owner / Admin' : 'Cashier' ?></p>
        </div>
        <a href="<?= url('auth/logout.php') ?>" class="btn-ghost p-2" title="Sign out">&#8677;</a>
      </div>
    </header>

    <!-- Closable navigation drawer for phones/tablets (any viewport below the
         "md" breakpoint) — the sidebar above is desktop/laptop-only. -->
    <div
      id="mobileNavOverlay"
      class="hidden md:hidden"
      style="position:fixed; inset:0; z-index:60;"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      <div onclick="closeMobileNav()" style="position:absolute; inset:0; background:rgba(0,0,0,0.45);"></div>
      <div style="position:relative; width:16rem; max-width:80vw; height:100%; background:#0f1116; color:#fff; display:flex; flex-direction:column; box-shadow:0 0 24px rgba(0,0,0,0.35);">
        <div class="flex items-center justify-between px-4" style="padding-top:1.1rem; padding-bottom:1.1rem; border-bottom:1px solid rgba(255,255,255,0.08);">
          <div class="flex items-center gap-2">
            <div class="h-9 w-9 rounded-xl bg-brand-500 flex items-center justify-center shrink-0 text-white font-bold">JP</div>
            <div class="leading-tight">
              <p class="font-semibold text-sm" style="color:#fff;">JP Laagan</p>
              <p class="text-[11px] text-ink-400">MotoPOS</p>
            </div>
          </div>
          <button
            type="button"
            onclick="closeMobileNav()"
            class="btn-ghost"
            style="padding:0.6rem; min-width:44px; min-height:44px; color:#fff;"
            aria-label="Close navigation menu"
          >
            <span aria-hidden="true" style="font-size:1.25rem; line-height:1;">&times;</span>
          </button>
        </div>
        <nav class="px-3 text-sm font-medium" style="padding-top:0.75rem; overflow-y:auto;">
          <?php if ($user['role'] === 'ADMIN'): ?>
          <a href="<?= url('dashboard.php') ?>" class="flex items-center rounded-lg" style="padding:0.85rem 0.75rem; margin-bottom:0.25rem; min-height:44px; <?= $currentScript === 'dashboard.php' ? 'background:#f9490c;color:#fff;' : 'color:#b0b8c8;' ?>">Dashboard</a>
          <?php endif; ?>
          <a href="<?= url('pos/index.php') ?>" class="flex items-center rounded-lg" style="padding:0.85rem 0.75rem; margin-bottom:0.25rem; min-height:44px; <?= $currentDir === 'pos' ? 'background:#f9490c;color:#fff;' : 'color:#b0b8c8;' ?>">Point of Sale</a>
          <?php if ($user['role'] === 'ADMIN'): ?>
          <a href="<?= url('inventory/index.php') ?>" class="flex items-center rounded-lg" style="padding:0.85rem 0.75rem; margin-bottom:0.25rem; min-height:44px; <?= $currentDir === 'inventory' ? 'background:#f9490c;color:#fff;' : 'color:#b0b8c8;' ?>">Inventory</a>
          <?php endif; ?>
          <a href="<?= url('sales/index.php') ?>" class="flex items-center rounded-lg" style="padding:0.85rem 0.75rem; margin-bottom:0.25rem; min-height:44px; <?= $currentDir === 'sales' ? 'background:#f9490c;color:#fff;' : 'color:#b0b8c8;' ?>">Sales History</a>
          <?php if ($user['role'] === 'ADMIN'): ?>
          <a href="<?= url('reports/index.php') ?>" class="flex items-center rounded-lg" style="padding:0.85rem 0.75rem; margin-bottom:0.25rem; min-height:44px; <?= $currentDir === 'reports' ? 'background:#f9490c;color:#fff;' : 'color:#b0b8c8;' ?>">Reports</a>
          <a href="<?= url('users/index.php') ?>" class="flex items-center rounded-lg" style="padding:0.85rem 0.75rem; margin-bottom:0.25rem; min-height:44px; <?= $currentDir === 'users' ? 'background:#f9490c;color:#fff;' : 'color:#b0b8c8;' ?>">Users</a>
          <a href="<?= url('settings/index.php') ?>" class="flex items-center rounded-lg" style="padding:0.85rem 0.75rem; margin-bottom:0.25rem; min-height:44px; <?= $currentDir === 'settings' ? 'background:#f9490c;color:#fff;' : 'color:#b0b8c8;' ?>">Settings</a>
          <?php endif; ?>
        </nav>
        <div class="px-4 text-[11px] text-ink-500" style="margin-top:auto; padding-top:1rem; padding-bottom:1rem;">v1.0 (PHP) &middot; Motorcycle Parts</div>
      </div>
    </div>
    <script>
      (function () {
        var overlay = document.getElementById('mobileNavOverlay');
        var toggleBtn = document.querySelector('[aria-controls="mobileNavOverlay"]');

        window.openMobileNav = function () {
          overlay.classList.remove('hidden');
          overlay.classList.add('flex');
          document.body.style.overflow = 'hidden';
          if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
        };
        window.closeMobileNav = function () {
          overlay.classList.add('hidden');
          overlay.classList.remove('flex');
          document.body.style.overflow = '';
          if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
        };
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') window.closeMobileNav();
        });
        // If the viewport is resized up to desktop width while the drawer is
        // open (e.g. rotating a tablet, or a laptop window un-maximizing),
        // close it so it can't get stuck open behind the desktop sidebar.
        window.addEventListener('resize', function () {
          if (window.innerWidth >= 768) window.closeMobileNav();
        });
      })();
    </script>
    <main class="flex-1 p-4 md:p-6">
      <?php $flash = flash_get(); if ($flash): ?>
        <div class="mb-4 rounded-lg px-4 py-3 text-sm <?= $flash['type'] === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100' ?>">
          <?= e($flash['message']) ?>
        </div>
      <?php endif; ?>
