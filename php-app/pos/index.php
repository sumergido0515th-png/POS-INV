<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_login();

$pageTitle = 'Point of Sale';
require __DIR__ . '/../includes/header.php';
?>

<div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
  <div class="space-y-4 min-w-0">
    <input id="search" class="input" placeholder="Search by name, SKU, or brand...">

    <div id="categoryChips" class="flex gap-2 overflow-x-auto pb-1"></div>

    <div id="productGrid" class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
      <p class="text-sm text-ink-500">Loading products...</p>
    </div>
  </div>

  <div class="lg:sticky lg:top-20 h-fit">
    <div class="card flex flex-col">
      <div class="p-4 border-b border-ink-100 flex items-center gap-2">
        <h2 class="font-semibold text-ink-900">Current Sale</h2>
        <span id="cartCount" class="badge bg-ink-100 text-ink-600 ml-auto">0 item(s)</span>
      </div>
      <div id="cartItems" class="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] max-h-[45vh]">
        <div class="h-full flex flex-col items-center justify-center text-ink-400 text-sm py-10">
          Cart is empty. Tap a product to add it.
        </div>
      </div>
      <div class="p-4 border-t border-ink-100 space-y-3">
        <div class="flex items-center justify-between text-sm text-ink-500">
          <span>Subtotal</span>
          <span id="cartSubtotal" class="font-semibold text-ink-900">₱0.00</span>
        </div>
        <button id="checkoutBtn" disabled class="btn-primary w-full py-3 text-base" style="width:100%">Charge ₱0.00</button>
      </div>
    </div>
  </div>
</div>

<!-- Checkout modal -->
<div id="checkoutModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 p-4">
  <div class="bg-white rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
    <div class="flex items-center justify-between px-5 py-4 border-b border-ink-100">
      <h2 class="font-semibold text-lg">Checkout</h2>
      <button onclick="closeCheckout()" class="btn-ghost p-1.5">&times;</button>
    </div>
    <div class="p-5 space-y-4">
      <div class="space-y-1.5 text-sm">
        <div class="flex justify-between"><span class="text-ink-500">Subtotal</span><span id="coSubtotal">₱0.00</span></div>
        <div class="flex justify-between items-center">
          <span class="text-ink-500">Discount</span>
          <input id="coDiscount" type="number" min="0" value="0" class="input w-28 text-right py-1" oninput="recalcCheckout()">
        </div>
        <div class="flex justify-between"><span class="text-ink-500">Tax (<span id="coTaxRate">0</span>%)</span><span id="coTax">₱0.00</span></div>
        <div class="flex justify-between text-base font-bold pt-2 border-t border-ink-100"><span>Total</span><span id="coTotal" class="text-brand-600">₱0.00</span></div>
      </div>

      <div>
        <label class="label">Payment Method</label>
        <div class="grid grid-cols-4 gap-2" id="coPaymentMethods">
          <button type="button" data-method="CASH" class="pm-btn rounded-lg border px-2 py-2 text-xs font-medium border-brand-500 bg-brand-50 text-brand-700">Cash</button>
          <button type="button" data-method="GCASH" class="pm-btn rounded-lg border px-2 py-2 text-xs font-medium border-ink-200 text-ink-600">GCash</button>
          <button type="button" data-method="CARD" class="pm-btn rounded-lg border px-2 py-2 text-xs font-medium border-ink-200 text-ink-600">Card</button>
          <button type="button" data-method="BANK_TRANSFER" class="pm-btn rounded-lg border px-2 py-2 text-xs font-medium border-ink-200 text-ink-600">Bank Transfer</button>
        </div>
      </div>

      <div>
        <label class="label">Amount Tendered</label>
        <input id="coAmountPaid" type="number" min="0" step="0.01" class="input text-lg font-semibold" oninput="recalcCheckout()">
        <div class="flex flex-wrap gap-2 mt-2">
          <button type="button" class="btn-secondary py-1 px-2 text-xs" onclick="setExact()">Exact</button>
          <button type="button" class="btn-secondary py-1 px-2 text-xs" onclick="setAmount(100)">₱100</button>
          <button type="button" class="btn-secondary py-1 px-2 text-xs" onclick="setAmount(200)">₱200</button>
          <button type="button" class="btn-secondary py-1 px-2 text-xs" onclick="setAmount(500)">₱500</button>
          <button type="button" class="btn-secondary py-1 px-2 text-xs" onclick="setAmount(1000)">₱1000</button>
        </div>
        <p class="text-sm text-ink-500 mt-2">Change: <span id="coChange" class="font-semibold text-ink-900">₱0.00</span></p>
      </div>

      <details class="text-sm">
        <summary class="text-ink-500 cursor-pointer">Customer info (optional)</summary>
        <div class="grid grid-cols-2 gap-2 mt-2">
          <input id="coCustomerName" class="input" placeholder="Customer name">
          <input id="coCustomerPhone" class="input" placeholder="Phone number">
        </div>
      </details>

      <p id="coError" class="hidden text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"></p>

      <button id="coSubmit" onclick="submitSale()" class="btn-primary w-full py-3 text-base" style="width:100%">Complete Sale</button>
    </div>
  </div>
</div>

<!-- Receipt modal -->
<div id="receiptModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/50 p-4">
  <div class="bg-white rounded-2xl w-full max-w-sm max-h-[92vh] overflow-y-auto">
    <div class="flex items-center justify-between px-4 py-3 border-b border-ink-100 print:hidden">
      <h2 class="font-semibold">Sale Complete</h2>
      <div class="flex gap-2">
        <button onclick="window.print()" class="btn-secondary py-1.5 px-3 text-xs">Print</button>
        <button onclick="closeReceipt()" class="btn-ghost p-1.5">&times;</button>
      </div>
    </div>
    <div id="receipt" class="p-6 font-mono text-xs"></div>
    <div class="px-4 pb-4 print:hidden">
      <button onclick="closeReceipt()" class="btn-primary w-full" style="width:100%">New Sale</button>
    </div>
  </div>
</div>

<script>
  window.CSRF_TOKEN = <?= json_encode(csrf_token()) ?>;
  window.API_BASE = <?= json_encode(url('api')) ?>;
  window.CURRENT_USER_NAME = <?= json_encode($user['name']) ?>;
</script>
<script src="<?= url('assets/js/pos.js') ?>"></script>

<?php require __DIR__ . '/../includes/footer.php'; ?>
