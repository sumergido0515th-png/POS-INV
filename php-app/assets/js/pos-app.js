/**
 * JP Laagan MotoPOS — POS screen, built with React (self-hosted UMD build,
 * no CDN, no build step) + htm for JSX-like templates without Babel.
 */
(function () {
  const html = htm.bind(React.createElement);
  const { useState, useEffect, useMemo, useCallback } = React;

  const PAYMENT_METHODS = [
    ['CASH', 'Cash'],
    ['GCASH', 'GCash'],
    ['CARD', 'Card'],
    ['BANK_TRANSFER', 'Bank Transfer'],
  ];
  const QUICK_CASH = [100, 200, 500, 1000];

  function fmt(n) {
    return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  async function getJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  }

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': window.CSRF_TOKEN },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  // ---------------------------------------------------------------------

  function ProductCard({ product, onAdd }) {
    const outOfStock = product.quantity <= 0;
    const lowStock = !outOfStock && product.quantity <= product.reorder_level;
    return html`
      <button
        data-id=${product.id}
        disabled=${outOfStock}
        onClick=${() => onAdd(product)}
        class="card p-3 text-left relative hover:shadow-md transition-shadow ${outOfStock ? 'opacity-50' : ''}"
      >
        ${outOfStock && html`<span class="badge bg-red-100 text-red-700 absolute top-2 right-2">Out</span>`}
        ${lowStock && html`<span class="badge bg-amber-100 text-amber-700 absolute top-2 right-2">Low</span>`}
        <div class="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-2 font-bold">+</div>
        <p class="text-sm font-semibold text-ink-900 leading-tight line-clamp-2" style=${{ minHeight: '2.5rem' }}>${product.name}</p>
        <p class="text-xs text-ink-400 mt-1">${product.sku}</p>
        <div class="flex items-center justify-between mt-2">
          <p class="text-sm font-bold text-brand-600">${fmt(product.selling_price)}</p>
          <p class="text-xs text-ink-400">${product.quantity} ${product.unit}</p>
        </div>
      </button>
    `;
  }

  function CartLine({ line, onInc, onDec, onRemove }) {
    return html`
      <div class="flex items-center gap-2 py-2 border-b border-ink-50">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-ink-900 truncate">${line.name}</p>
          <p class="text-xs text-ink-400">${fmt(line.unit_price)} × ${line.quantity}</p>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button class="h-6 w-6 rounded-md border border-ink-200" onClick=${() => onDec(line.product_id)}>-</button>
          <span style=${{ width: '1.5rem', textAlign: 'center' }} class="text-sm font-medium">${line.quantity}</span>
          <button
            class="h-6 w-6 rounded-md border border-ink-200"
            disabled=${line.quantity >= line.max_quantity}
            onClick=${() => onInc(line.product_id)}
          >+</button>
          <button class="h-6 w-6 rounded-md ml-1" style=${{ color: '#dc2626' }} onClick=${() => onRemove(line.product_id)}>×</button>
        </div>
        <p class="w-20 text-right text-sm font-semibold text-ink-900 shrink-0">${fmt(line.unit_price * line.quantity)}</p>
      </div>
    `;
  }

  function CartPanel({ cart, subtotal, onInc, onDec, onRemove, onCheckout }) {
    return html`
      <div class="card" style=${{ display: 'flex', flexDirection: 'column' }}>
        <div class="p-4 border-b border-ink-100 flex items-center gap-2">
          <h2 class="font-semibold text-ink-900">Current Sale</h2>
          <span class="badge bg-ink-100 text-ink-600" style=${{ marginLeft: 'auto' }}>${cart.length} item(s)</span>
        </div>
        <div class="p-3" style=${{ overflowY: 'auto', minHeight: '200px', maxHeight: '45vh' }}>
          ${cart.length === 0
            ? html`<div class="flex flex-col items-center justify-center text-ink-400 text-sm py-10" style=${{ height: '100%' }}>Cart is empty. Tap a product to add it.</div>`
            : cart.map((line) => html`<${CartLine} key=${line.product_id} line=${line} onInc=${onInc} onDec=${onDec} onRemove=${onRemove} />`)}
        </div>
        <div class="p-4 border-t border-ink-100 space-y-3">
          <div class="flex items-center justify-between text-sm text-ink-500">
            <span>Subtotal</span>
            <span class="font-semibold text-ink-900">${fmt(subtotal)}</span>
          </div>
          <button
            class="btn-primary"
            style=${{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
            disabled=${cart.length === 0}
            onClick=${onCheckout}
          >Charge ${fmt(subtotal)}</button>
        </div>
      </div>
    `;
  }

  function CheckoutModal({ subtotal, taxRate, currency, onClose, onConfirm }) {
    const [discount, setDiscount] = useState(0);
    const [method, setMethod] = useState('CASH');
    const [amountPaid, setAmountPaid] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const discountedSubtotal = Math.max(0, subtotal - (parseFloat(discount) || 0));
    const tax = (discountedSubtotal * taxRate) / 100;
    const total = discountedSubtotal + tax;
    const paid = parseFloat(amountPaid) || 0;
    const change = Math.max(0, paid - total);

    async function submit() {
      setError('');
      if (paid < total) {
        setError('Amount paid must cover the total.');
        return;
      }
      setSubmitting(true);
      try {
        await onConfirm({
          discount: parseFloat(discount) || 0,
          payment_method: method,
          amount_paid: paid,
          customer_name: customerName,
          customer_phone: customerPhone,
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setSubmitting(false);
      }
    }

    return html`
      <div class="fixed inset-0 z-50 flex items-center justify-center" style=${{ background: 'rgba(0,0,0,0.4)', padding: '1rem' }}>
        <div class="bg-white rounded-2xl w-full max-w-md" style=${{ maxHeight: '92vh', overflowY: 'auto' }}>
          <div class="flex items-center justify-between px-5 py-4 border-b border-ink-100">
            <h2 class="font-semibold text-lg">Checkout</h2>
            <button class="btn-ghost p-1.5" onClick=${onClose}>×</button>
          </div>
          <div class="p-5 space-y-4">
            <div class="space-y-1.5 text-sm">
              <div class="flex justify-between"><span class="text-ink-500">Subtotal</span><span>${fmt(subtotal)}</span></div>
              <div class="flex justify-between items-center">
                <span class="text-ink-500">Discount</span>
                <input type="number" min="0" value=${discount} class="input" style=${{ width: '7rem', textAlign: 'right', padding: '0.25rem 0.5rem' }}
                  onInput=${(e) => setDiscount(e.target.value)} />
              </div>
              <div class="flex justify-between"><span class="text-ink-500">Tax (${taxRate}%)</span><span>${fmt(tax)}</span></div>
              <div class="flex justify-between font-bold text-base border-t border-ink-100" style=${{ paddingTop: '0.5rem' }}>
                <span>Total</span><span class="text-brand-600">${fmt(total)}</span>
              </div>
            </div>

            <div>
              <label class="label">Payment Method</label>
              <div class="grid grid-cols-4 gap-2">
                ${PAYMENT_METHODS.map(
                  ([value, label]) => html`
                  <button
                    key=${value}
                    class="rounded-lg border px-2 py-2 text-xs font-medium"
                    style=${method === value
                      ? { borderColor: '#f9490c', background: '#fff4ed', color: '#c22308' }
                      : { borderColor: '#d5d9e2', color: '#4f5b73' }}
                    onClick=${() => setMethod(value)}
                  >${label}</button>
                `
                )}
              </div>
            </div>

            <div>
              <label class="label">Amount Tendered</label>
              <input
                type="number" min="0" step="0.01" autofocus
                class="input" style=${{ fontSize: '1.125rem', fontWeight: 600 }}
                value=${amountPaid} onInput=${(e) => setAmountPaid(e.target.value)}
              />
              <div class="flex flex-wrap gap-2 mt-2">
                <button class="btn-secondary" style=${{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick=${() => setAmountPaid(total.toFixed(2))}>Exact</button>
                ${QUICK_CASH.map(
                  (v) => html`<button key=${v} class="btn-secondary" style=${{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick=${() => setAmountPaid(String(v))}>₱${v}</button>`
                )}
              </div>
              <p class="text-sm text-ink-500 mt-2">Change: <span class="font-semibold text-ink-900">${fmt(change)}</span></p>
            </div>

            <details class="text-sm">
              <summary class="text-ink-500" style=${{ cursor: 'pointer' }}>Customer info (optional)</summary>
              <div class="grid grid-cols-2 gap-2 mt-2">
                <input class="input" placeholder="Customer name" value=${customerName} onInput=${(e) => setCustomerName(e.target.value)} />
                <input class="input" placeholder="Phone number" value=${customerPhone} onInput=${(e) => setCustomerPhone(e.target.value)} />
              </div>
            </details>

            ${error && html`<p class="text-sm" style=${{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '0.5rem', padding: '0.5rem 0.75rem' }}>${error}</p>`}

            <button class="btn-primary" style=${{ width: '100%', padding: '0.75rem', fontSize: '1rem' }} disabled=${submitting} onClick=${submit}>
              ${submitting ? 'Processing…' : 'Complete Sale'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function Receipt({ sale, settings, onClose }) {
    const paymentLabels = { CASH: 'Cash', GCASH: 'GCash', CARD: 'Card', BANK_TRANSFER: 'Bank Transfer' };
    return html`
      <div class="fixed inset-0 z-50 flex items-center justify-center" style=${{ background: 'rgba(0,0,0,0.5)', padding: '1rem' }}>
        <div class="bg-white rounded-2xl w-full max-w-sm" style=${{ maxHeight: '92vh', overflowY: 'auto' }}>
          <div class="flex items-center justify-between px-4 py-3 border-b border-ink-100 print:hidden">
            <h2 class="font-semibold">Sale Complete</h2>
            <div class="flex gap-2">
              <button class="btn-secondary" style=${{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }} onClick=${() => window.print()}>Print</button>
              <button class="btn-ghost p-1.5" onClick=${onClose}>×</button>
            </div>
          </div>
          <div id="receipt" class="p-6 font-mono text-xs">
            <div class="text-center mb-3">
              <p class="font-bold text-sm">${settings.business_name}</p>
              ${settings.address && html`<p>${settings.address}</p>`}
              ${settings.phone && html`<p>${settings.phone}</p>`}
            </div>
            <div class="border-t border-dashed border-ink-300 my-2"></div>
            <p>Invoice: ${sale.invoice_no}</p>
            <p>Date: ${new Date(sale.created_at).toLocaleString('en-PH')}</p>
            <p>Cashier: ${sale.cashier_name}</p>
            ${sale.customer_name && html`<p>Customer: ${sale.customer_name}</p>`}
            <div class="border-t border-dashed border-ink-300 my-2"></div>
            <div class="space-y-1">
              ${sale.items.map(
                (i) => html`
                <div key=${i.product_id}>
                  <div>${i.product_name}</div>
                  <div class="flex justify-between text-ink-500">
                    <span>${i.quantity} × ${fmt(i.unit_price)}</span>
                    <span>${fmt(i.line_total)}</span>
                  </div>
                </div>
              `
              )}
            </div>
            <div class="border-t border-dashed border-ink-300 my-2"></div>
            <div class="space-y-0.5">
              <div class="flex justify-between"><span>Subtotal</span><span>${fmt(sale.subtotal)}</span></div>
              <div class="flex justify-between"><span>Discount</span><span>-${fmt(sale.discount)}</span></div>
              <div class="flex justify-between"><span>Tax</span><span>${fmt(sale.tax)}</span></div>
              <div class="flex justify-between font-bold text-sm" style=${{ paddingTop: '0.25rem' }}><span>TOTAL</span><span>${fmt(sale.total)}</span></div>
              <div class="flex justify-between" style=${{ paddingTop: '0.25rem' }}><span>${paymentLabels[sale.payment_method]}</span><span>${fmt(sale.amount_paid)}</span></div>
              <div class="flex justify-between"><span>Change</span><span>${fmt(sale.change_due)}</span></div>
            </div>
            <div class="border-t border-dashed border-ink-300 my-2"></div>
            ${settings.receipt_footer && html`<p class="text-center">${settings.receipt_footer}</p>`}
          </div>
          <div class="px-4 pb-4 print:hidden">
            <button class="btn-primary" style=${{ width: '100%' }} onClick=${onClose}>New Sale</button>
          </div>
        </div>
      </div>
    `;
  }

  function App() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [settings, setSettings] = useState(null);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [cart, setCart] = useState([]);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadProducts = useCallback(() => getJSON(`${window.API_BASE}/products.php`).then(setProducts), []);

    useEffect(() => {
      Promise.all([
        loadProducts(),
        getJSON(`${window.API_BASE}/categories.php`).then(setCategories),
        getJSON(`${window.API_BASE}/settings.php`).then(setSettings),
      ]).finally(() => setLoading(false));
    }, [loadProducts]);

    const filtered = useMemo(() => {
      return products.filter((p) => {
        if (categoryFilter && String(p.category_id) !== String(categoryFilter)) return false;
        if (search) {
          const q = search.toLowerCase();
          return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.brand_name || '').toLowerCase().includes(q);
        }
        return true;
      });
    }, [products, search, categoryFilter]);

    const subtotal = useMemo(() => cart.reduce((sum, l) => sum + l.unit_price * l.quantity, 0), [cart]);

    const addToCart = useCallback((product) => {
      setCart((prev) => {
        const existing = prev.find((l) => l.product_id === product.id);
        if (existing) {
          if (existing.quantity >= product.quantity) return prev;
          return prev.map((l) => (l.product_id === product.id ? { ...l, quantity: l.quantity + 1 } : l));
        }
        return [
          ...prev,
          {
            product_id: product.id,
            name: product.name,
            sku: product.sku,
            unit_price: Number(product.selling_price),
            quantity: 1,
            max_quantity: product.quantity,
          },
        ];
      });
    }, []);

    const inc = useCallback((id) => {
      setCart((prev) => prev.map((l) => (l.product_id === id && l.quantity < l.max_quantity ? { ...l, quantity: l.quantity + 1 } : l)));
    }, []);
    const dec = useCallback((id) => {
      setCart((prev) => prev.map((l) => (l.product_id === id ? { ...l, quantity: l.quantity - 1 } : l)).filter((l) => l.quantity > 0));
    }, []);
    const remove = useCallback((id) => setCart((prev) => prev.filter((l) => l.product_id !== id)), []);

    async function confirmSale(payload) {
      const sale = await postJSON(`${window.API_BASE}/create_sale.php`, {
        items: cart.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
        ...payload,
      });
      setReceipt(sale);
      setCart([]);
      setCheckoutOpen(false);
      loadProducts();
    }

    if (loading || !settings) {
      return html`<p class="text-sm text-ink-500">Loading products…</p>`;
    }

    return html`
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <div class="space-y-4 min-w-0">
          <input class="input" placeholder="Search by name, SKU, or brand..." value=${search} onInput=${(e) => setSearch(e.target.value)} />
          <div class="flex gap-2 overflow-x-auto pb-1">
            <button
              class="px-3 py-1.5 rounded-full text-xs font-medium border shrink-0"
              style=${categoryFilter === '' ? { background: '#f9490c', color: '#fff', borderColor: '#f9490c' } : { borderColor: '#d5d9e2', color: '#4f5b73' }}
              onClick=${() => setCategoryFilter('')}
            >All</button>
            ${categories.map(
              (c) => html`
              <button
                key=${c.id}
                class="px-3 py-1.5 rounded-full text-xs font-medium border shrink-0"
                style=${String(categoryFilter) === String(c.id) ? { background: '#f9490c', color: '#fff', borderColor: '#f9490c' } : { borderColor: '#d5d9e2', color: '#4f5b73' }}
                onClick=${() => setCategoryFilter(c.id)}
              >${c.name}</button>
            `
            )}
          </div>
          ${filtered.length === 0
            ? html`<p class="text-sm text-ink-500">No products match your search.</p>`
            : html`
              <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                ${filtered.map((p) => html`<${ProductCard} key=${p.id} product=${p} onAdd=${addToCart} />`)}
              </div>
            `}
        </div>

        <div class="lg:sticky lg:top-20" style=${{ height: 'fit-content' }}>
          <${CartPanel} cart=${cart} subtotal=${subtotal} onInc=${inc} onDec=${dec} onRemove=${remove} onCheckout=${() => setCheckoutOpen(true)} />
        </div>

        ${checkoutOpen &&
        html`
          <${CheckoutModal}
            subtotal=${subtotal}
            taxRate=${Number(settings.tax_rate)}
            currency=${settings.currency}
            onClose=${() => setCheckoutOpen(false)}
            onConfirm=${confirmSale}
          />
        `}

        ${receipt && html`<${Receipt} sale=${receipt} settings=${settings} onClose=${() => setReceipt(null)} />`}
      </div>
    `;
  }

  const root = ReactDOM.createRoot(document.getElementById('pos-app'));
  root.render(html`<${App} />`);
})();
