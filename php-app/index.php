<?php
require_once __DIR__ . '/includes/bootstrap.php';

if (!is_logged_in()) {
    redirect('auth/login.php');
}

$user = current_user();
redirect($user['role'] === 'ADMIN' ? 'dashboard.php' : 'pos/index.php');
