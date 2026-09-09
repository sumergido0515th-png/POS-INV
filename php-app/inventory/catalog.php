<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_role(['ADMIN']);

$tab = $_GET['tab'] ?? 'categories';
if (!in_array($tab, ['categories', 'brands', 'suppliers'], true)) {
    $tab = 'categories';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = $_POST['action'] ?? '';

    if ($action === 'add_category') {
        $name = trim($_POST['name'] ?? '');
        $desc = trim($_POST['description'] ?? '');
        if ($name !== '') {
            try {
                db()->prepare('INSERT INTO categories (name, description) VALUES (?, ?)')->execute([$name, $desc ?: null]);
                flash_set('success', 'Category added.');
            } catch (PDOException $e) {
                flash_set('error', 'Category name already exists.');
            }
        }
    } elseif ($action === 'delete_category') {
        $id = (int) $_POST['id'];
        $c = db()->prepare('SELECT COUNT(*) FROM products WHERE category_id = ?'); $c->execute([$id]);
        if ((int) $c->fetchColumn() > 0) {
            flash_set('error', 'Cannot delete: products use this category.');
        } else {
            db()->prepare('DELETE FROM categories WHERE id = ?')->execute([$id]);
            flash_set('success', 'Category deleted.');
        }
    } elseif ($action === 'add_brand') {
        $name = trim($_POST['name'] ?? '');
        if ($name !== '') {
            try {
                db()->prepare('INSERT INTO brands (name) VALUES (?)')->execute([$name]);
                flash_set('success', 'Brand added.');
            } catch (PDOException $e) {
                flash_set('error', 'Brand name already exists.');
            }
        }
    } elseif ($action === 'delete_brand') {
        $id = (int) $_POST['id'];
        $c = db()->prepare('SELECT COUNT(*) FROM products WHERE brand_id = ?'); $c->execute([$id]);
        if ((int) $c->fetchColumn() > 0) {
            flash_set('error', 'Cannot delete: products use this brand.');
        } else {
            db()->prepare('DELETE FROM brands WHERE id = ?')->execute([$id]);
            flash_set('success', 'Brand deleted.');
        }
    } elseif ($action === 'add_supplier') {
        $name = trim($_POST['name'] ?? '');
        if ($name !== '') {
            db()->prepare('INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)')
                ->execute([$name, trim($_POST['contact_person'] ?? '') ?: null, trim($_POST['phone'] ?? '') ?: null, trim($_POST['email'] ?? '') ?: null, trim($_POST['address'] ?? '') ?: null]);
            flash_set('success', 'Supplier added.');
        }
    } elseif ($action === 'delete_supplier') {
        $id = (int) $_POST['id'];
        $c = db()->prepare('SELECT COUNT(*) FROM products WHERE supplier_id = ?'); $c->execute([$id]);
        if ((int) $c->fetchColumn() > 0) {
            flash_set('error', 'Cannot delete: products use this supplier.');
        } else {
            db()->prepare('DELETE FROM suppliers WHERE id = ?')->execute([$id]);
            flash_set('success', 'Supplier deleted.');
        }
    }
    redirect('inventory/catalog.php?tab=' . $tab);
}

$categories = db()->query('SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id=c.id) AS cnt FROM categories c ORDER BY name')->fetchAll();
$brands = db()->query('SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id=b.id) AS cnt FROM brands b ORDER BY name')->fetchAll();
$suppliers = db()->query('SELECT s.*, (SELECT COUNT(*) FROM products p WHERE p.supplier_id=s.id) AS cnt FROM suppliers s ORDER BY name')->fetchAll();

$pageTitle = 'Categories, Brands & Suppliers';
require __DIR__ . '/../includes/header.php';
?>

<div class="space-y-4">
  <a href="<?= url('inventory/index.php') ?>" class="text-sm text-ink-500">&larr; Back to Inventory</a>

  <div class="flex gap-2 border-b border-ink-100">
    <?php foreach (['categories' => 'Categories', 'brands' => 'Brands', 'suppliers' => 'Suppliers'] as $key => $label): ?>
      <a href="?tab=<?= $key ?>" class="<?= $tab === $key ? 'text-brand-600' : 'text-ink-500' ?>" style="padding:0.5rem 1rem;font-size:0.875rem;font-weight:500;border-bottom:2px solid <?= $tab === $key ? '#f9490c' : 'transparent' ?>"><?= $label ?></a>
    <?php endforeach; ?>
  </div>

  <?php if ($tab === 'categories'): ?>
    <div class="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
      <div class="card">
        <?php foreach ($categories as $c): ?>
          <div class="flex items-center justify-between border-b border-ink-50" style="padding:0.75rem">
            <div><p class="font-medium text-ink-900"><?= e($c['name']) ?></p><?php if ($c['description']): ?><p class="text-xs text-ink-400"><?= e($c['description']) ?></p><?php endif; ?></div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-ink-400"><?= $c['cnt'] ?> product(s)</span>
              <form method="post" onsubmit="return confirm('Delete this category?');"><?= csrf_field() ?><input type="hidden" name="action" value="delete_category"><input type="hidden" name="id" value="<?= $c['id'] ?>"><button class="btn-ghost" style="color:#dc2626">Delete</button></form>
            </div>
          </div>
        <?php endforeach; ?>
        <?php if (!$categories): ?><p class="text-sm text-ink-400" style="padding:1rem">No categories yet.</p><?php endif; ?>
      </div>
      <form method="post" class="card p-4">
        <?= csrf_field() ?><input type="hidden" name="action" value="add_category">
        <h3 class="font-semibold text-ink-900 mb-3">Add Category</h3>
        <input required name="name" class="input mb-2" placeholder="Name">
        <input name="description" class="input mb-3" placeholder="Description (optional)">
        <button type="submit" class="btn-primary" style="width:100%">Add</button>
      </form>
    </div>
  <?php elseif ($tab === 'brands'): ?>
    <div class="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
      <div class="card">
        <?php foreach ($brands as $b): ?>
          <div class="flex items-center justify-between border-b border-ink-50" style="padding:0.75rem">
            <p class="font-medium text-ink-900"><?= e($b['name']) ?></p>
            <div class="flex items-center gap-3">
              <span class="text-xs text-ink-400"><?= $b['cnt'] ?> product(s)</span>
              <form method="post" onsubmit="return confirm('Delete this brand?');"><?= csrf_field() ?><input type="hidden" name="action" value="delete_brand"><input type="hidden" name="id" value="<?= $b['id'] ?>"><button class="btn-ghost" style="color:#dc2626">Delete</button></form>
            </div>
          </div>
        <?php endforeach; ?>
        <?php if (!$brands): ?><p class="text-sm text-ink-400" style="padding:1rem">No brands yet.</p><?php endif; ?>
      </div>
      <form method="post" class="card p-4">
        <?= csrf_field() ?><input type="hidden" name="action" value="add_brand">
        <h3 class="font-semibold text-ink-900 mb-3">Add Brand</h3>
        <input required name="name" class="input mb-3" placeholder="e.g. Honda, Universal">
        <button type="submit" class="btn-primary" style="width:100%">Add</button>
      </form>
    </div>
  <?php else: ?>
    <div class="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
      <div class="card">
        <?php foreach ($suppliers as $s): ?>
          <div class="flex items-center justify-between border-b border-ink-50" style="padding:0.75rem">
            <div>
              <p class="font-medium text-ink-900"><?= e($s['name']) ?></p>
              <p class="text-xs text-ink-400"><?= e(implode(' · ', array_filter([$s['contact_person'], $s['phone'], $s['email']]))) ?: 'No contact info' ?></p>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-ink-400"><?= $s['cnt'] ?> product(s)</span>
              <form method="post" onsubmit="return confirm('Delete this supplier?');"><?= csrf_field() ?><input type="hidden" name="action" value="delete_supplier"><input type="hidden" name="id" value="<?= $s['id'] ?>"><button class="btn-ghost" style="color:#dc2626">Delete</button></form>
            </div>
          </div>
        <?php endforeach; ?>
        <?php if (!$suppliers): ?><p class="text-sm text-ink-400" style="padding:1rem">No suppliers yet.</p><?php endif; ?>
      </div>
      <form method="post" class="card p-4">
        <?= csrf_field() ?><input type="hidden" name="action" value="add_supplier">
        <h3 class="font-semibold text-ink-900 mb-3">Add Supplier</h3>
        <input required name="name" class="input mb-2" placeholder="Name">
        <input name="contact_person" class="input mb-2" placeholder="Contact person">
        <input name="phone" class="input mb-2" placeholder="Phone">
        <input name="email" class="input mb-2" placeholder="Email">
        <input name="address" class="input mb-3" placeholder="Address">
        <button type="submit" class="btn-primary" style="width:100%">Add</button>
      </form>
    </div>
  <?php endif; ?>
</div>

<?php require __DIR__ . '/../includes/footer.php'; ?>
