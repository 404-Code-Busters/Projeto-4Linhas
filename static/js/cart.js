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
					<div class="cart-item-qty">Qtd: ${Number(item.quantidade || 1)}</div>
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
				openCartModal();
			});
			el.dataset.cartHandler = '1';
		}
	});

	// Ensure cart count is initialized
	try { updateCartCount(); } catch (e) { /* ignore */ }
});
