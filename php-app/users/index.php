<?php
require_once __DIR__ . '/../includes/bootstrap.php';
$currentUser = require_role(['ADMIN']);

$users = db()->query('SELECT id, name, username, email, role, is_active FROM users ORDER BY created_at ASC')->fetchAll();

$roleLabels = ['ADMIN' => 'Owner / Admin', 'CASHIER' => 'Cashier'];

$pageTitle = 'User Management';
require __DIR__ . '/../includes/header.php';
?>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <p class="text-sm text-ink-500">Manage who can access the system and what they can do.</p>
    <a href="<?= url('users/new.php') ?>" class="btn-primary">+ Add User</a>
  </div>

  <div class="card" style="overflow-x:auto">
    <table class="data-table">
      <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
      <tbody>
        <?php foreach ($users as $u): ?>
          <tr>
            <td class="font-medium text-ink-900"><?= e($u['name']) ?> <?php if ((int) $u['id'] === (int) $currentUser['id']): ?><span class="text-xs text-ink-400">(you)</span><?php endif; ?></td>
            <td class="text-ink-600"><?= e($u['username']) ?></td>
            <td class="text-ink-600"><?= e($u['email'] ?? '—') ?></td>
            <td><span class="badge <?= $u['role'] === 'ADMIN' ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-600' ?>"><?= $roleLabels[$u['role']] ?></span></td>
            <td><span class="badge <?= $u['is_active'] ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-600' ?>"><?= $u['is_active'] ? 'Active' : 'Inactive' ?></span></td>
            <td style="text-align:right">
              <a href="<?= url('users/edit.php?id=' . $u['id']) ?>" class="btn-ghost" style="padding:0.4rem 0.6rem">Edit</a>
              <?php if ((int) $u['id'] !== (int) $currentUser['id']): ?>
                <form method="post" action="<?= url('users/delete.php') ?>" style="display:inline" onsubmit="return confirm('Remove this user?');">
                  <?= csrf_field() ?><input type="hidden" name="id" value="<?= $u['id'] ?>">
                  <button type="submit" class="btn-ghost" style="padding:0.4rem 0.6rem;color:#dc2626">Delete</button>
                </form>
              <?php endif; ?>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<?php require __DIR__ . '/../includes/footer.php'; ?>
