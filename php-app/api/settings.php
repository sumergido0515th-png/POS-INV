<?php
require_once __DIR__ . '/../includes/bootstrap.php';

if (!is_logged_in()) {
    json_error('Unauthorized', 401);
}

$settings = db()->query('SELECT * FROM settings ORDER BY id LIMIT 1')->fetch();
if (!$settings) {
    json_error('Settings not configured', 500);
}
$settings['tax_rate'] = (float) $settings['tax_rate'];
$settings['low_stock_threshold'] = (int) $settings['low_stock_threshold'];

json_response($settings);
