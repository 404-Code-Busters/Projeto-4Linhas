// Promo messages cycling will initialize on DOMContentLoaded to avoid duplicate globals

// Hamburger menu toggle
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.style.display = mobileMenu.style.display === 'block' ? 'none' : 'block';
  });

  // Close menu when clicking outside
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) {
      mobileMenu.style.display = 'none';
    }
  });
}

// Search modal functionality
const searchButton = document.querySelector('.search-button');
const searchModal = document.getElementById('search-modal');
const closeModal = document.querySelector('.close-modal');

if (searchButton && searchModal && closeModal) {
  searchButton.addEventListener('click', () => {
    searchModal.style.display = 'flex';
  });

  closeModal.addEventListener('click', () => {
    searchModal.style.display = 'none';
  });

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === searchModal) {
      searchModal.style.display = 'none';
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchModal.style.display === 'flex') {
      searchModal.style.display = 'none';
    }
  });
}

// Dropdown de benefícios (login/cadastro)
const promoArrow = document.querySelector('.promo-arrow');
const benefitsDropdown = document.querySelector('.benefits-dropdown');
let isDropdownOpen = false;

if (promoArrow && benefitsDropdown) {
  promoArrow.addEventListener('click', (e) => {
    e.stopPropagation();
    isDropdownOpen = !isDropdownOpen;
    benefitsDropdown.classList.toggle('active');
    promoArrow.style.transform = isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)';
  });

  // Fecha o dropdown ao clicar fora
  document.addEventListener('click', (e) => {
    if (!promoArrow.contains(e.target) && !benefitsDropdown.contains(e.target) && isDropdownOpen) {
      isDropdownOpen = false;
      benefitsDropdown.classList.remove('active');
      promoArrow.style.transform = 'rotate(0deg)';
    }
  });

  // Fecha com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isDropdownOpen) {
      isDropdownOpen = false;
      benefitsDropdown.classList.remove('active');
      promoArrow.style.transform = 'rotate(0deg)';
    }
  });
}

// Promo code validation
function validatePromoCode(code) {
  const validCodes = ['DESCONTO10', 'FRETEGRATIS', 'PROMO20'];
  return validCodes.includes(code.toUpperCase());
}

// Apply promo code
function applyPromoCode() {
  const promoInput = document.getElementById('promo-code');
  const code = promoInput.value.trim();

  if (!code) {
    showPromoMessage('Por favor, insira um código promocional', 'error');
    return;
  }

  if (validatePromoCode(code)) {
    showPromoMessage('Código promocional aplicado com sucesso!', 'success');
    promoInput.value = '';
    // Here you would apply the discount to the total
    // For demo purposes, we'll just show the message
  } else {
    showPromoMessage('Código promocional inválido', 'error');
  }
}

// Show promo message
function showPromoMessage(message, type) {
  // Remove existing message
  const existingMessage = document.querySelector('.promo-feedback');
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageElement = document.createElement('div');
  messageElement.className = `promo-feedback ${type}`;
  messageElement.textContent = message;

  const promoSection = document.querySelector('.promo-code-section');
  promoSection.appendChild(messageElement);

  // Auto remove after 3 seconds
  setTimeout(() => {
    if (messageElement.parentNode) {
      messageElement.remove();
    }
  }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Initialize promo messages (guarded)
  const promoMessage = document.querySelector('.promo-message');
  if (promoMessage) {
    const messages = ['30% OFF em toda a loja', '4linhas para tudo e todos', 'Frete grátis acima de R$100', 'Novidades toda semana'];
    let currentPromo = 0;
    const showNextPromo = () => {
      promoMessage.style.opacity = 0;
      setTimeout(() => {
        currentPromo = (currentPromo + 1) % messages.length;
        promoMessage.textContent = messages[currentPromo];
        promoMessage.style.opacity = 1;
      }, 500);
    };
    setInterval(showNextPromo, 5000);
  }
  // Load cart
  // Do not open modal on cart page load; instead render the cart inside the page
  try { renderCartPage(); } catch (e) { /* ignore if function not present */ }

  // Update cart count
  updateCartCount();

  // Apply promo code button
  const applyPromoBtn = document.querySelector('.apply-promo-btn');
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener('click', applyPromoCode);
  }

  // Enter key for promo code
  const promoInput = document.getElementById('promo-code');
  if (promoInput) {
    promoInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        applyPromoCode();
      }
    });
  }
});

/* -----------------------------
   Cart page rendering utilities
   ----------------------------- */
function currencyBRL(value) {
  return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
}

function renderCartPage() {
  const container = document.querySelector('.cart-items');
  const summary = document.querySelector('.cart-summary');
  if (!container) return;

  const cart = window.getCart ? window.getCart() : [];
  container.innerHTML = '';

  if (!cart || cart.length === 0) {
    container.innerHTML = '<p>Seu carrinho está vazio.</p>';
    // update summary totals
    updateSummary(0);
    updateCartCount();
    return;
  }

  let subtotal = 0;

  cart.forEach((item, idx) => {
    const price = Number(item.preco || 0);
    const qty = Number(item.quantidade || 1);
    const itemTotal = price * qty;
    subtotal += itemTotal;

    const node = document.createElement('div');
    node.className = 'cart-item';
    node.dataset.productId = item.id || item.nome || idx;
    node.innerHTML = `
      <img src="${item.imagem || ''}" alt="${item.nome || ''}">
      <div class="item-details">
        <h3>${item.nome || ''}</h3>
        <p class="product-price">${currencyBRL(itemTotal)}</p>
        <div class="quantity-controls">
          <button class="quantity-btn minus-btn" data-idx="${idx}">-</button>
          <span class="quantity" data-quantity="${qty}">${qty}</span>
          <button class="quantity-btn plus-btn" data-idx="${idx}">+</button>
        </div>
      </div>
      <button class="remove-btn" data-idx="${idx}">Remover</button>
    `;
    container.appendChild(node);
  });

  updateSummary(subtotal);
  attachCartPageHandlers();
  updateCartCount();
}

function updateSummary(subtotal) {
  const summaryRows = document.querySelector('.cart-summary');
  if (!summaryRows) return;
  const frete = subtotal > 0 ? 20.00 : 0.00; // placeholder
  const total = subtotal + frete;
  // Replace displayed values (assumes specific DOM structure)
  const subtotalEl = summaryRows.querySelector('.summary-row:nth-of-type(1) span:last-child');
  const freteEl = summaryRows.querySelector('.summary-row:nth-of-type(2) span:last-child');
  const totalEl = summaryRows.querySelector('.summary-row.total span:last-child');
  if (subtotalEl) subtotalEl.textContent = currencyBRL(subtotal);
  if (freteEl) freteEl.textContent = currencyBRL(frete);
  if (totalEl) totalEl.textContent = currencyBRL(total);
}

function attachCartPageHandlers() {
  const plusButtons = document.querySelectorAll('.quantity-btn.plus-btn');
  const minusButtons = document.querySelectorAll('.quantity-btn.minus-btn');
  const removeButtons = document.querySelectorAll('.remove-btn');

  plusButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(e.currentTarget.dataset.idx);
      changeQuantity(idx, 1);
    });
  });

  minusButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(e.currentTarget.dataset.idx);
      changeQuantity(idx, -1);
    });
  });

  removeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(e.currentTarget.dataset.idx);
      const cart = window.getCart ? window.getCart() : [];
      if (idx >= 0 && idx < cart.length) {
        cart.splice(idx, 1);
        window.setCart ? window.setCart(cart) : localStorage.setItem('cart', JSON.stringify(cart));
        renderCartPage();
      }
    });
  });
}

function changeQuantity(idx, delta) {
  const cart = window.getCart ? window.getCart() : [];
  if (!(idx >= 0 && idx < cart.length)) return;
  cart[idx].quantidade = Math.max(1, (Number(cart[idx].quantidade) || 1) + delta);
  window.setCart ? window.setCart(cart) : localStorage.setItem('cart', JSON.stringify(cart));
  renderCartPage();
}

// Expose for debugging if needed
window.renderCartPage = renderCartPage;
