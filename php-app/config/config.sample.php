<?php
/**
 * JP Laagan MotoPOS — site configuration.
 * EDIT THE DATABASE CREDENTIALS BELOW before uploading to InfinityFree —
 * get them from the InfinityFree control panel (MySQL Databases section).
 */

// ---- Database (InfinityFree gives you these on the "MySQL Databases" page) ----
define('DB_HOST', 'sqlXXX.infinityfree.com');   // e.g. sql123.infinityfree.com
define('DB_NAME', 'if0_XXXXXXXX_motopos');      // your database name
define('DB_USER', 'if0_XXXXXXXX');              // your database username
define('DB_PASS', 'change-me');                 // your database password

// ---- App ----
define('APP_NAME', 'JP Laagan MotoPOS');
define('SESSION_NAME', 'motopos_session');

// BASE_URL must match where the app is hosted, with NO trailing slash.
// Root domain:      'https://yoursite.infinityfreeapp.com'
// Subfolder deploy: 'https://yoursite.infinityfreeapp.com/motopos'
define('BASE_URL', '');

// Timezone for all displayed dates/timestamps.
date_default_timezone_set('Asia/Manila');

error_reporting(E_ALL);
ini_set('display_errors', '0'); // keep off in production; PHP errors should never leak to visitors
