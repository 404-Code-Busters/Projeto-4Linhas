
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

// Remove placeholder cart functions since cart.js is included now

// Handle scroll for header changes (outside DOMContentLoaded to ensure it works immediately)
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    document.body.classList.add('scrolled');
  } else {
    document.body.classList.remove('scrolled');
  }
});

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Promo messages cycling
  const promoMessage = document.querySelector('.promo-message');
  const messages = ['30% OFF em toda a loja', '4linhas para tudo e todos', 'Frete grátis acima de R$100', 'Novidades toda semana'];
  let currentPromo = 0;

  function showNextPromo() {
    promoMessage.style.opacity = 0;
    setTimeout(() => {
      currentPromo = (currentPromo + 1) % messages.length;
      promoMessage.textContent = messages[currentPromo];
      promoMessage.style.opacity = 1;
    }, 500);
  }

  // Start cycling every 5 seconds
  setInterval(showNextPromo, 5000);

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

  // Update cart count
  // Cart button behavior (moved from inline script in template)
  const cartBtn = document.getElementById('cart-button');
  if (cartBtn) {
    cartBtn.addEventListener('click', function(e) {
      e.preventDefault();
      try { if (typeof openCartModal === 'function') return openCartModal(); } catch (err) { /* ignore */ }
      try { if (typeof mostrarCarrinho === 'function') return mostrarCarrinho(); } catch (err) { /* ignore */ }
      const fake = document.querySelector('a[data-cart]');
      if (fake) { fake.click(); }
    });
  }

  updateCartCount();

  // Scroll to top button
  const scrollToTopBtn = document.querySelector('.scroll-to-top');
  if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Inicializar Swiper (hero) se existir
  try {
    if (typeof Swiper !== 'undefined') {
      const heroEl = document.querySelector('.hero-swiper');
      if (heroEl) {
        const heroPagination = heroEl.querySelector('.swiper-pagination');
        const heroNext = heroEl.querySelector('.swiper-button-next');
        const heroPrev = heroEl.querySelector('.swiper-button-prev');

        new Swiper(heroEl, {
          loop: true,
          pagination: heroPagination ? { el: heroPagination, clickable: true } : false,
          navigation: { nextEl: heroNext || undefined, prevEl: heroPrev || undefined },
          autoplay: { delay: 5000, disableOnInteraction: false },
          effect: 'slide',
        });
      }
    }
  } catch (err) {
    console.error('Erro ao inicializar Swiper:', err);
  }
});
