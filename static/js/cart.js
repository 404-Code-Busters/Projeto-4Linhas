// Minimal cart functionality stubs to avoid runtime errors when other scripts call these functions.
// These provide safe no-op behavior and simple cart-count rendering using localStorage.

function _getCartFromStorage() {
	try {
		const raw = localStorage.getItem('cart');
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch (e) {
		console.warn('Erro ao ler carrinho do localStorage:', e);
		return [];
	}
}

function _setCartToStorage(cart) {
	try {
		localStorage.setItem('cart', JSON.stringify(Array.isArray(cart) ? cart : []));
	} catch (e) {
		console.warn('Erro ao salvar carrinho no localStorage:', e);
	}
}

function _clearCartStorage() {
	try {
		localStorage.removeItem('cart');
	} catch (e) {
		console.warn('Erro ao limpar carrinho do localStorage:', e);
	}
}

function mostrarCarrinho() {
	// Render cart into a modal. If modal not present, create it.
	const cart = _getCartFromStorage();
	try { console.debug('[cart.js] mostrarCarrinho() called — cart length:', Array.isArray(cart) ? cart.length : 0); } catch (e) { /* noop */ }
	let modal = document.getElementById('cart-modal');
	if (!modal) {
		modal = document.createElement('div');
		modal.id = 'cart-modal';
		modal.className = 'cart-modal';
		modal.innerHTML = `
			<div class="cart-modal-backdrop"></div>
			<div class="cart-modal-panel">
				<div class="cart-modal-header">
					<h2 class="cart-modal-title">Seu Carrinho</h2>
					<button class="cart-modal-close" aria-label="Fechar">&times;</button>
				</div>
				<div class="cart-items"></div>
				<div class="cart-total" style="margin-top: 1rem; font-weight: 700; text-align: right;"></div>
				<div class="cart-actions">
					<button class="cart-checkout">Ir para o carrinho</button>
				</div>
			</div>
		`;
		document.body.appendChild(modal);

		// Close handlers
		modal.querySelector('.cart-modal-close').addEventListener('click', () => closeCartModal());
		modal.querySelector('.cart-modal-backdrop').addEventListener('click', () => closeCartModal());
		modal.querySelector('.cart-checkout').addEventListener('click', () => {
			// Navigate to the dedicated cart page
			window.location.href = '/carrinho';
		});
	}

	const container = modal.querySelector('.cart-items');
	const totalContainer = modal.querySelector('.cart-total');
	container.innerHTML = '';
	totalContainer.innerHTML = '';

	if (!cart || cart.length === 0) {
		container.innerHTML = '<p>Seu carrinho está vazio.</p>';
	} else {
		let total = 0;
		cart.forEach((item, idx) => {
			const row = document.createElement('div');
			row.className = 'cart-item-row';
			const itemTotal = (Number(item.preco) || 0) * (Number(item.quantidade) || 1);
			total += itemTotal;
			row.innerHTML = `
				<img src="${item.imagem || ''}" alt="${item.nome || ''}" class="cart-item-img">
				<div class="cart-item-info">
					<div class="cart-item-name">${item.nome || ''}</div>
					<div class="cart-item-price">R$ ${itemTotal.toFixed(2)}</div>
					<div class="cart-item-qty">Qtd: <button class="qty-decr" data-idx="${idx}">-</button> <span class="qty-value">${Number(item.quantidade || 1)}</span> <button class="qty-incr" data-idx="${idx}">+</button></div>
				</div>
				<button class="cart-item-remove" data-idx="${idx}">Remover</button>
			`;
			container.appendChild(row);
		});

		totalContainer.textContent = `Total: R$ ${total.toFixed(2)}`;

		// attach remove handlers
		container.querySelectorAll('.cart-item-remove').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const idx = Number(e.currentTarget.dataset.idx);
				removeItemAtIndex(idx);
			});
		});

		// attach qty +/- handlers
		container.querySelectorAll('.qty-incr').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const idx = Number(e.currentTarget.dataset.idx);
				changeQuantityAtIndex(idx, 1);
			});
		});
		container.querySelectorAll('.qty-decr').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const idx = Number(e.currentTarget.dataset.idx);
				changeQuantityAtIndex(idx, -1);
			});
		});
	}

	// Show modal (use class to trigger CSS transitions)
	modal.classList.add('open');
}

function updateCartCount() {
	const cart = _getCartFromStorage();
	const el = document.getElementById('cart-count');
	if (!el) return;
	// Sum quantities if present, otherwise use number of items
	const count = cart.reduce((acc, it) => acc + (Number(it.quantidade) || 1), 0);
	el.textContent = String(count);
	try {
		if (count <= 0) {
			el.style.display = 'none';
		} else {
			el.style.display = 'inline-flex';
			el.style.alignItems = 'center';
			el.style.justifyContent = 'center';
			el.style.minWidth = '18px';
			el.style.padding = '0 6px';
			el.style.height = '18px';
			el.style.borderRadius = '999px';
			el.style.backgroundColor = '#FF6B35';
			el.style.color = '#fff';
			el.style.fontSize = '11px';
			el.style.fontWeight = '600';
			el.style.border = '2px solid #fff';
		}
	} catch (e) { /* ignore style errors */ }
}

function openCartModal() {
	mostrarCarrinho();
}

function closeCartModal() {
	const modal = document.getElementById('cart-modal');
	if (modal) modal.classList.remove('open');
}

function removeItemAtIndex(idx) {
	try {
		const cart = _getCartFromStorage();
		if (idx >= 0 && idx < cart.length) {
			cart.splice(idx, 1);
			localStorage.setItem('cart', JSON.stringify(cart));
			updateCartCount();
			mostrarCarrinho();
		}
	} catch (e) {
		console.error('Erro ao remover item do carrinho:', e);
	}
}

function changeQuantityAtIndex(idx, delta) {
	try {
		const cart = _getCartFromStorage();
		if (idx >= 0 && idx < cart.length) {
			const item = cart[idx];
			const newQty = (Number(item.quantidade) || 1) + Number(delta);
			if (newQty <= 0) {
				// remove item if quantity falls to zero or below
				cart.splice(idx, 1);
			} else {
				item.quantidade = newQty;
			}
			localStorage.setItem('cart', JSON.stringify(cart));
			updateCartCount();
			mostrarCarrinho();
		}
	} catch (e) {
		console.error('Erro ao alterar quantidade do item:', e);
	}
}

// Export to global scope (already global in browsers) but ensure availability
window.mostrarCarrinho = mostrarCarrinho;
window.updateCartCount = updateCartCount;
window.getCart = _getCartFromStorage;
window.setCart = _setCartToStorage;
window.clearCart = _clearCartStorage;

/**
 * Add a product to the cart stored in localStorage.
 * If the product already exists (matching nome), increment quantidade.
 * item: { id (optional), nome, preco (optional), quantidade (optional) }
 */
function adicionarAoCarrinho(item) {
	// Prevent accidental double adds: ignore if same item added within 400ms
	if (!window.__cart_last_adds) window.__cart_last_adds = new Map();
	try {
		const key = item.id || item.nome || '__anon__';
		const last = window.__cart_last_adds.get(key) || 0;
		const now = Date.now();
		if (now - last < 400) {
			// ignore duplicate rapid add
			try { console.debug('[cart.js] Ignoring rapid duplicate add for', key); } catch (e) {}
			return;
		}
		window.__cart_last_adds.set(key, now);
	} catch (e) { /* ignore timestamp errors */ }
	try {
		const cart = _getCartFromStorage();
		const id = item.id || item.nome;
		const existing = cart.find(c => (c.id || c.nome) === id || c.nome === item.nome);
		if (existing) {
			existing.quantidade = (Number(existing.quantidade) || 1) + (Number(item.quantidade) || 1);
			// update image/preco if provided
			if (item.imagem) existing.imagem = item.imagem;
			if (item.preco) existing.preco = item.preco;
		} else {
			cart.push({ id: id, nome: item.nome, preco: item.preco || 0, quantidade: Number(item.quantidade) || 1, imagem: item.imagem || '' });
		}
		localStorage.setItem('cart', JSON.stringify(cart));
		updateCartCount();
		// Do not auto-open modal on add; user opens via cart icon. Keep updateCartCount so counter updates immediately.
	} catch (e) {
		console.error('Erro ao adicionar ao carrinho:', e);
	}
}

window.adicionarAoCarrinho = adicionarAoCarrinho;

// Intercept cart icon click to open modal
document.addEventListener('DOMContentLoaded', () => {
	// Attach handler to any anchor or button that contains the cart count or a cart icon image
	const candidates = document.querySelectorAll('a, button');
	candidates.forEach(el => {
		if (el.dataset.cartHandler) return; // already attached
		const hasCount = el.querySelector('#cart-count') !== null;
		const hasCartImg = Array.from(el.querySelectorAll('img')).some(img => (img.alt || '').toLowerCase().includes('carrinho') || (img.src || '').toLowerCase().includes('carrinho'));
		if (hasCount || hasCartImg || el.classList.contains('cart-link')) {
			el.addEventListener('click', (e) => {
				// If it's an anchor that navigates to another page, prevent navigation and open modal
				if (el.tagName.toLowerCase() === 'a') e.preventDefault();
				try { console.debug('[cart.js] header candidate clicked, opening cart modal'); } catch (err) {}
				openCartModal();
			});
			el.dataset.cartHandler = '1';
		}
	});

	// Ensure cart count is initialized
	try { updateCartCount(); } catch (e) { /* ignore */ }
});

// Delegated click handler as a robust fallback: catches clicks on any current or future
// cart triggers (#cart-button, .cart-button, a.cart-link, a[data-cart]) and opens the modal.
document.addEventListener('click', function (e) {
	try {
		const trigger = e.target.closest && e.target.closest('#cart-button, .cart-button, a.cart-link, a[data-cart]');
		if (!trigger) return;
		// Prevent navigation for anchors and open modal
		if (trigger.tagName && trigger.tagName.toLowerCase() === 'a') e.preventDefault();
		// Ensure modal function exists
		try { console.debug('[cart.js] delegated click caught on', trigger); } catch (err) {}
		if (typeof mostrarCarrinho === 'function') {
			mostrarCarrinho();
		} else if (typeof openCartModal === 'function') {
			openCartModal();
		}
	} catch (err) {
		// swallow to avoid breaking page
		console.warn('Delegated cart click handler error:', err);
	}
}, false);

// Additional cross-page bindings: support product-detail pages and sites where header uses a button
document.addEventListener('DOMContentLoaded', () => {
	// Bind product detail 'add-to-cart' button(s) — some pages use .add-to-cart (single) or .add-to-cart-btn (list)
	const detailBtns = document.querySelectorAll('.add-to-cart, .add-to-cart-btn');
	detailBtns.forEach(btn => {
		if (btn.dataset.__cartBound) return;
		btn.addEventListener('click', (e) => {
			try {
				// If product page, try to collect sensible info
				const card = e.target.closest('.product-main, .outfit-card, .related-card') || document;
				const nameEl = card.querySelector('.product-title, h3, .product-card-title');
				const productName = nameEl ? nameEl.textContent.trim() : 'Produto';
				const priceEl = card.querySelector('.product-price') || card.querySelector('.related-price') || null;
				let priceNumber = 0;
				if (priceEl) {
					priceNumber = parseFloat(String(priceEl.textContent).replace(/[^0-9,\.]/g, '').replace(',', '.')) || 0;
				}
				const imgEl = card.querySelector('img') || document.querySelector('img.product-image-main');
				const imgSrc = imgEl ? imgEl.getAttribute('src') : '';
				const id = btn.dataset && btn.dataset.id ? btn.dataset.id : undefined;
				adicionarAoCarrinho({ id: id, nome: productName, preco: priceNumber, quantidade: 1, imagem: imgSrc });
			} catch (err) {
				console.error('Failed to add product via detail button:', err);
			}
		});
		btn.dataset.__cartBound = '1';
	});

	// Ensure header cart button opens modal. Support both <a class="cart-link"> and <button id="cart-button">
	const cartBtn = document.getElementById('cart-button') || document.querySelector('a.cart-link, a[data-cart], button.cart-button');
	if (cartBtn && !cartBtn.dataset.__cartClick) {
		cartBtn.addEventListener('click', (e) => {
			// If anchor, prevent navigation to open modal
			if (cartBtn.tagName.toLowerCase() === 'a') e.preventDefault();
			mostrarCarrinho();
		});
		cartBtn.dataset.__cartClick = '1';
	}
});
