(function () {
  let products = [];
  let categories = [];
  let settings = null;
  let categoryFilter = '';
  let searchTerm = '';
  let cart = []; // {product_id, name, sku, unit_price, quantity, max_quantity, unit}
  let selectedPaymentMethod = 'CASH';

  function fmt(n) {
    return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function e(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  async function loadAll() {
    const [p, c, s] = await Promise.all([
      fetch(`${API_BASE}/products.php`).then((r) => r.json()),
      fetch(`${API_BASE}/categories.php`).then((r) => r.json()),
      fetch(`${API_BASE}/settings.php`).then((r) => r.json()),
    ]);
    products = p;
    categories = c;
    settings = s;
    renderChips();
    renderGrid();
  }

  function renderChips() {
    const el = document.getElementById('categoryChips');
    const chip = (id, label, active) =>
      `<button data-cat="${id}" class="px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 ${active ? 'bg-brand-500 text-white border-brand-500' : 'border-ink-200 text-ink-600'}">${e(label)}</button>`;
    let html = chip('', 'All', categoryFilter === '');
    categories.forEach((c) => {
      html += chip(c.id, c.name, String(categoryFilter) === String(c.id));
    });
    el.innerHTML = html;
    el.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        categoryFilter = btn.dataset.cat;
        renderChips();
        renderGrid();
      });
    });
  }

  function filteredProducts() {
    return products.filter((p) => {
      if (categoryFilter && String(p.category_id) !== String(categoryFilter)) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.brand_name || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }

  function renderGrid() {
    const el = document.getElementById('productGrid');
    const list = filteredProducts();
    if (list.length === 0) {
      el.innerHTML = '<p class="text-sm text-ink-500 col-span-full">No products match your search.</p>';
      return;
    }
    el.innerHTML = list
      .map((p) => {
        const outOfStock = p.quantity <= 0;
        const lowStock = !outOfStock && p.quantity <= p.reorder_level;
        const badge = outOfStock
          ? '<span class="badge bg-red-100 text-red-700 absolute top-2 right-2">Out</span>'
          : lowStock
          ? '<span class="badge bg-amber-100 text-amber-700 absolute top-2 right-2">Low</span>'
          : '';
        return `
        <button data-id="${p.id}" ${outOfStock ? 'disabled' : ''} class="card p-3 text-left relative hover:shadow-md transition-shadow ${outOfStock ? 'opacity-50' : ''}">
          ${badge}
          <div class="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-2 font-bold">+</div>
          <p class="text-sm font-semibold text-ink-900 leading-tight line-clamp-2 min-h-[2.5rem]">${e(p.name)}</p>
          <p class="text-xs text-ink-400 mt-1">${e(p.sku)}</p>
          <div class="flex items-center justify-between mt-2">
            <p class="text-sm font-bold text-brand-600">${fmt(p.selling_price)}</p>
            <p class="text-xs text-ink-400">${p.quantity} ${e(p.unit)}</p>
          </div>
        </button>`;
      })
      .join('');
    el.querySelectorAll('button[data-id]').forEach((btn) => {
      btn.addEventListener('click', () => addToCart(parseInt(btn.dataset.id, 10)));
    });
  }

  function addToCart(productId) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const existing = cart.find((l) => l.product_id === productId);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        alert('No more stock available');
        return;
      }
      existing.quantity += 1;
    } else {
      cart.push({
        product_id: productId,
        name: product.name,
        sku: product.sku,
        unit_price: product.selling_price,
        quantity: 1,
        max_quantity: product.quantity,
        unit: product.unit,
      });
    }
    renderCart();
  }

  function changeQty(productId, delta) {
    const line = cart.find((l) => l.product_id === productId);
    if (!line) return;
    line.quantity += delta;
    if (line.quantity <= 0) {
      cart = cart.filter((l) => l.product_id !== productId);
    } else if (line.quantity > line.max_quantity) {
      line.quantity = line.max_quantity;
    }
    renderCart();
  }

  function removeLine(productId) {
    cart = cart.filter((l) => l.product_id !== productId);
    renderCart();
  }

  function cartSubtotal() {
    return cart.reduce((sum, l) => sum + l.unit_price * l.quantity, 0);
  }

  function renderCart() {
    const el = document.getElementById('cartItems');
    document.getElementById('cartCount').textContent = `${cart.length} item(s)`;
    if (cart.length === 0) {
      el.innerHTML =
        '<div class="h-full flex flex-col items-center justify-center text-ink-400 text-sm py-10">Cart is empty. Tap a product to add it.</div>';
    } else {
      el.innerHTML = cart
        .map(
          (l) => `
        <div class="flex items-center gap-2 py-2 border-b border-ink-50">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-ink-900 truncate">${e(l.name)}</p>
            <p class="text-xs text-ink-400">${fmt(l.unit_price)} &times; ${l.quantity}</p>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button class="h-6 w-6 rounded-md border border-ink-200" onclick="POS.changeQty(${l.product_id}, -1)">-</button>
            <span class="w-6 text-center text-sm font-medium">${l.quantity}</span>
            <button class="h-6 w-6 rounded-md border border-ink-200" onclick="POS.changeQty(${l.product_id}, 1)">+</button>
            <button class="h-6 w-6 rounded-md text-red-500 ml-1" onclick="POS.removeLine(${l.product_id})">&times;</button>
          </div>
          <p class="w-20 text-right text-sm font-semibold text-ink-900 shrink-0">${fmt(l.unit_price * l.quantity)}</p>
        </div>`
        )
        .join('');
    }
    const subtotal = cartSubtotal();
    document.getElementById('cartSubtotal').textContent = fmt(subtotal);
    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.textContent = `Charge ${fmt(subtotal)}`;
    checkoutBtn.disabled = cart.length === 0;
  }

  // ---- Checkout modal ----

  function openCheckout() {
    if (cart.length === 0) return;
    document.getElementById('coDiscount').value = 0;
    document.getElementById('coAmountPaid').value = '';
    document.getElementById('coError').classList.add('hidden');
    document.getElementById('coTaxRate').textContent = settings.tax_rate;
    selectedPaymentMethod = 'CASH';
    document.querySelectorAll('.pm-btn').forEach((b) => {
      b.classList.toggle('border-brand-500', b.dataset.method === 'CASH');
      b.classList.toggle('bg-brand-50', b.dataset.method === 'CASH');
      b.classList.toggle('text-brand-700', b.dataset.method === 'CASH');
      b.classList.toggle('border-ink-200', b.dataset.method !== 'CASH');
      b.classList.toggle('text-ink-600', b.dataset.method !== 'CASH');
    });
    recalcCheckout();
    document.getElementById('checkoutModal').classList.remove('hidden');
    document.getElementById('checkoutModal').classList.add('flex');
  }

  function closeCheckout() {
    document.getElementById('checkoutModal').classList.add('hidden');
    document.getElementById('checkoutModal').classList.remove('flex');
  }

  function checkoutTotals() {
    const subtotal = cartSubtotal();
    const discount = parseFloat(document.getElementById('coDiscount').value) || 0;
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const tax = (discountedSubtotal * settings.tax_rate) / 100;
    const total = discountedSubtotal + tax;
    return { subtotal, discount, tax, total };
  }

  function recalcCheckout() {
    const { subtotal, tax, total } = checkoutTotals();
    document.getElementById('coSubtotal').textContent = fmt(subtotal);
    document.getElementById('coTax').textContent = fmt(tax);
    document.getElementById('coTotal').textContent = fmt(total);
    const paid = parseFloat(document.getElementById('coAmountPaid').value) || 0;
    document.getElementById('coChange').textContent = fmt(Math.max(0, paid - total));
  }

  function setExact() {
    const { total } = checkoutTotals();
    document.getElementById('coAmountPaid').value = total.toFixed(2);
    recalcCheckout();
  }

  function setAmount(v) {
    document.getElementById('coAmountPaid').value = v;
    recalcCheckout();
  }

  async function submitSale() {
    const { discount, total } = checkoutTotals();
    const paid = parseFloat(document.getElementById('coAmountPaid').value) || 0;
    const errorEl = document.getElementById('coError');
    errorEl.classList.add('hidden');

    if (paid < total) {
      errorEl.textContent = 'Amount paid must cover the total.';
      errorEl.classList.remove('hidden');
      return;
    }

    const payload = {
      items: cart.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
      discount,
      payment_method: selectedPaymentMethod,
      amount_paid: paid,
      customer_name: document.getElementById('coCustomerName').value,
      customer_phone: document.getElementById('coCustomerPhone').value,
    };

    try {
      const res = await fetch(`${API_BASE}/create_sale.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': CSRF_TOKEN },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process sale');

      closeCheckout();
      renderReceipt(data);
      cart = [];
      renderCart();
      loadAll();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    }
  }

  function renderReceipt(sale) {
    const paymentLabels = { CASH: 'Cash', GCASH: 'GCash', CARD: 'Card', BANK_TRANSFER: 'Bank Transfer' };
    const itemsHtml = sale.items
      .map(
        (i) => `
      <div>
        <div>${e(i.product_name)}</div>
        <div class="flex justify-between text-ink-500">
          <span>${i.quantity} &times; ${fmt(i.unit_price)}</span>
          <span>${fmt(i.line_total)}</span>
        </div>
      </div>`
      )
      .join('');

    document.getElementById('receipt').innerHTML = `
      <div class="text-center mb-3">
        <p class="font-bold text-sm">${e(settings.business_name)}</p>
        ${settings.address ? `<p>${e(settings.address)}</p>` : ''}
        ${settings.phone ? `<p>${e(settings.phone)}</p>` : ''}
      </div>
      <div class="border-t border-dashed border-ink-300 my-2"></div>
      <p>Invoice: ${e(sale.invoice_no)}</p>
      <p>Date: ${new Date(sale.created_at).toLocaleString('en-PH')}</p>
      <p>Cashier: ${e(sale.cashier_name)}</p>
      ${sale.customer_name ? `<p>Customer: ${e(sale.customer_name)}</p>` : ''}
      <div class="border-t border-dashed border-ink-300 my-2"></div>
      <div class="space-y-1">${itemsHtml}</div>
      <div class="border-t border-dashed border-ink-300 my-2"></div>
      <div class="space-y-0.5">
        <div class="flex justify-between"><span>Subtotal</span><span>${fmt(sale.subtotal)}</span></div>
        <div class="flex justify-between"><span>Discount</span><span>-${fmt(sale.discount)}</span></div>
        <div class="flex justify-between"><span>Tax</span><span>${fmt(sale.tax)}</span></div>
        <div class="flex justify-between font-bold text-sm pt-1"><span>TOTAL</span><span>${fmt(sale.total)}</span></div>
        <div class="flex justify-between pt-1"><span>${paymentLabels[sale.payment_method]}</span><span>${fmt(sale.amount_paid)}</span></div>
        <div class="flex justify-between"><span>Change</span><span>${fmt(sale.change_due)}</span></div>
      </div>
      <div class="border-t border-dashed border-ink-300 my-2"></div>
      ${settings.receipt_footer ? `<p class="text-center">${e(settings.receipt_footer)}</p>` : ''}
    `;
    document.getElementById('receiptModal').classList.remove('hidden');
    document.getElementById('receiptModal').classList.add('flex');
  }

  function closeReceipt() {
    document.getElementById('receiptModal').classList.add('hidden');
    document.getElementById('receiptModal').classList.remove('flex');
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadAll();
    document.getElementById('search').addEventListener('input', (e) => {
      searchTerm = e.target.value;
      renderGrid();
    });
    document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
    document.querySelectorAll('.pm-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedPaymentMethod = btn.dataset.method;
        document.querySelectorAll('.pm-btn').forEach((b) => {
          const active = b === btn;
          b.classList.toggle('border-brand-500', active);
          b.classList.toggle('bg-brand-50', active);
          b.classList.toggle('text-brand-700', active);
          b.classList.toggle('border-ink-200', !active);
          b.classList.toggle('text-ink-600', !active);
        });
      });
    });
  });

  // expose the handful of functions used from inline HTML handlers
  window.POS = { changeQty, removeLine };
  window.closeCheckout = closeCheckout;
  window.recalcCheckout = recalcCheckout;
  window.setExact = setExact;
  window.setAmount = setAmount;
  window.submitSale = submitSale;
  window.closeReceipt = closeReceipt;
})();
