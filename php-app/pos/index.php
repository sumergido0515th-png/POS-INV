<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_login();

$pageTitle = 'Point of Sale';
require __DIR__ . '/../includes/header.php';
?>

<div id="pos-app">
  <p class="text-sm text-ink-500">Loading POS…</p>
</div>

<script>
  window.CSRF_TOKEN = <?= json_encode(csrf_token()) ?>;
  window.API_BASE = <?= json_encode(url('api')) ?>;
  window.CURRENT_USER_NAME = <?= json_encode($user['name']) ?>;
</script>
<script src="<?= url('assets/js/vendor/react.production.min.js') ?>"></script>
<script src="<?= url('assets/js/vendor/react-dom.production.min.js') ?>"></script>
<script src="<?= url('assets/js/vendor/htm.js') ?>"></script>
<script src="<?= url('assets/js/pos-app.js') ?>"></script>

<?php require __DIR__ . '/../includes/footer.php'; ?>
