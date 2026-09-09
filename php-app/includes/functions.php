<?php
/** Shared helper functions. */

function e(?string $value): string
{
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

function format_currency($value, string $currency = 'PHP'): string
{
    $symbols = ['PHP' => '₱', 'USD' => '$'];
    $symbol = $symbols[$currency] ?? $currency . ' ';
    return $symbol . number_format((float) $value, 2);
}

function format_date($datetime): string
{
    if (!$datetime) {
        return '';
    }
    $ts = is_numeric($datetime) ? (int) $datetime : strtotime((string) $datetime);
    return date('M j, Y g:i A', $ts);
}

function redirect(string $path): void
{
    $url = rtrim(BASE_URL, '/') . '/' . ltrim($path, '/');
    header('Location: ' . $url);
    exit;
}

function url(string $path): string
{
    return rtrim(BASE_URL, '/') . '/' . ltrim($path, '/');
}

function flash_set(string $type, string $message): void
{
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function flash_get(): ?array
{
    if (empty($_SESSION['flash'])) {
        return null;
    }
    $flash = $_SESSION['flash'];
    unset($_SESSION['flash']);
    return $flash;
}

function generate_invoice_no(): string
{
    $date = date('Ymd');
    $rand = strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));
    $time = substr((string) round(microtime(true) * 1000), -5);
    return "INV-{$date}-{$time}{$rand}";
}

/** JSON response helper for api/*.php endpoints. */
function json_response($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function json_error(string $message, int $status = 400): void
{
    json_response(['error' => $message], $status);
}

/** Reads and JSON-decodes the request body for API endpoints. */
function json_input(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
