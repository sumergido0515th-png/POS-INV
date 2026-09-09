<?php
/** Session-based auth. include_once after config.php, db.php, functions.php. */

if (session_status() === PHP_SESSION_NONE) {
    session_name(SESSION_NAME);
    session_start();
}

function current_user(): ?array
{
    return $_SESSION['user'] ?? null;
}

function is_logged_in(): bool
{
    return isset($_SESSION['user']);
}

function require_login(): array
{
    $user = current_user();
    if (!$user) {
        redirect('auth/login.php');
    }
    return $user;
}

/** @param string[] $roles */
function require_role(array $roles): array
{
    $user = require_login();
    if (!in_array($user['role'], $roles, true)) {
        redirect('pos/index.php');
    }
    return $user;
}

function attempt_login(string $username, string $password): bool
{
    $stmt = db()->prepare('SELECT * FROM users WHERE username = ? LIMIT 1');
    $stmt->execute([strtolower(trim($username))]);
    $user = $stmt->fetch();

    if (!$user || !(int) $user['is_active']) {
        return false;
    }
    if (!password_verify($password, $user['password_hash'])) {
        return false;
    }

    session_regenerate_id(true);
    $_SESSION['user'] = [
        'id' => (int) $user['id'],
        'name' => $user['name'],
        'username' => $user['username'],
        'role' => $user['role'],
    ];
    return true;
}

/** For api/*.php endpoints: JSON 401/403 instead of a redirect. */
function require_role_json(array $roles): array
{
    $user = current_user();
    if (!$user) {
        json_error('Unauthorized', 401);
    }
    if (!in_array($user['role'], $roles, true)) {
        json_error('Forbidden', 403);
    }
    return $user;
}

function logout(): void
{
    $_SESSION = [];
    session_destroy();
}

// ---- CSRF ----

function csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf_token" value="' . e(csrf_token()) . '">';
}

function verify_csrf(): void
{
    $token = $_POST['csrf_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!$token || !hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        http_response_code(403);
        die('Invalid or expired form submission (CSRF check failed). Go back and try again.');
    }
}
