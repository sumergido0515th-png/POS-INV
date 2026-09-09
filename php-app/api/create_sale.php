<?php
require_once __DIR__ . '/../includes/bootstrap.php';

$user = current_user();
if (!$user || !in_array($user['role'], ['ADMIN', 'CASHIER'], true)) {
    json_error('Unauthorized', 401);
}
verify_csrf();

$body = json_input();
$items = $body['items'] ?? [];
$discount = (float) ($body['discount'] ?? 0);
$paymentMethod = $body['payment_method'] ?? 'CASH';
$amountPaid = (float) ($body['amount_paid'] ?? 0);
$customerName = trim($body['customer_name'] ?? '');
$customerPhone = trim($body['customer_phone'] ?? '');

$allowedPayments = ['CASH', 'GCASH', 'CARD', 'BANK_TRANSFER'];
if (!in_array($paymentMethod, $allowedPayments, true)) {
    json_error('Invalid payment method');
}
if (!is_array($items) || count($items) === 0) {
    json_error('Cart is empty');
}

$pdo = db();

try {
    $pdo->beginTransaction();

    $subtotal = 0.0;
    $lineItems = [];

    foreach ($items as $item) {
        $productId = (int) ($item['product_id'] ?? 0);
        $quantity = (int) ($item['quantity'] ?? 0);
        if ($productId <= 0 || $quantity <= 0) {
            throw new RuntimeException('Invalid cart item');
        }

        // Lock the row so concurrent sales on the same product can't oversell.
        $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ? FOR UPDATE');
        $stmt->execute([$productId]);
        $product = $stmt->fetch();

        if (!$product) {
            throw new RuntimeException("Product not found: {$productId}");
        }
        if (!(int) $product['is_active']) {
            throw new RuntimeException("{$product['name']} is no longer available");
        }
        if ((int) $product['quantity'] < $quantity) {
            throw new RuntimeException("Insufficient stock for {$product['name']} ({$product['quantity']} left)");
        }

        $unitPrice = (float) $product['selling_price'];
        $lineTotal = round($unitPrice * $quantity, 2);
        $subtotal += $lineTotal;

        $lineItems[] = [
            'product_id' => $productId,
            'product_name' => $product['name'],
            'sku' => $product['sku'],
            'unit_price' => $unitPrice,
            'quantity' => $quantity,
            'line_total' => $lineTotal,
        ];
    }

    $settings = $pdo->query('SELECT * FROM settings ORDER BY id LIMIT 1')->fetch();
    $taxRate = $settings ? (float) $settings['tax_rate'] : 0.0;

    $discountedSubtotal = max(0, $subtotal - $discount);
    $tax = round($discountedSubtotal * $taxRate / 100, 2);
    $total = round($discountedSubtotal + $tax, 2);

    if ($amountPaid < $total) {
        throw new RuntimeException(sprintf('Amount paid (%.2f) is less than total (%.2f)', $amountPaid, $total));
    }

    $invoiceNo = generate_invoice_no();
    $stmt = $pdo->prepare(
        'INSERT INTO sales (invoice_no, customer_name, customer_phone, subtotal, discount, tax, total, amount_paid, change_due, payment_method, cashier_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $invoiceNo,
        $customerName ?: null,
        $customerPhone ?: null,
        $subtotal,
        $discount,
        $tax,
        $total,
        $amountPaid,
        round($amountPaid - $total, 2),
        $paymentMethod,
        $user['id'],
    ]);
    $saleId = (int) $pdo->lastInsertId();

    $itemStmt = $pdo->prepare(
        'INSERT INTO sale_items (sale_id, product_id, product_name, sku, unit_price, quantity, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stockStmt = $pdo->prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?');
    $movementStmt = $pdo->prepare(
        "INSERT INTO stock_movements (product_id, type, quantity, reason, user_id, sale_id) VALUES (?, 'SALE', ?, ?, ?, ?)"
    );

    foreach ($lineItems as $item) {
        $itemStmt->execute([
            $saleId,
            $item['product_id'],
            $item['product_name'],
            $item['sku'],
            $item['unit_price'],
            $item['quantity'],
            $item['line_total'],
        ]);
        $stockStmt->execute([$item['quantity'], $item['product_id']]);
        $movementStmt->execute([$item['product_id'], $item['quantity'], "Sale {$invoiceNo}", $user['id'], $saleId]);
    }

    $pdo->commit();

    json_response([
        'id' => $saleId,
        'invoice_no' => $invoiceNo,
        'created_at' => date('c'),
        'cashier_name' => $user['name'],
        'customer_name' => $customerName ?: null,
        'items' => $lineItems,
        'subtotal' => $subtotal,
        'discount' => $discount,
        'tax' => $tax,
        'total' => $total,
        'amount_paid' => $amountPaid,
        'change_due' => round($amountPaid - $total, 2),
        'payment_method' => $paymentMethod,
    ], 201);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_error($e->getMessage(), 400);
}
