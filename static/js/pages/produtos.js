// Promo messages cycling will be initialized on DOMContentLoaded to avoid duplicate global vars

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

// Scroll event for scrolled class
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    document.body.classList.add('scrolled');
  } else {
    document.body.classList.remove('scrolled');
  }
});

// Filter toggle
const filterToggle = document.querySelector('.filter-toggle');
const filters = document.querySelector('.filters');

if (filterToggle && filters) {
  filterToggle.addEventListener('click', () => {
    filters.classList.toggle('active');
  });
}

// Sort dropdown
const sortSelect = document.querySelector('.sort-select');

if (sortSelect) {
  sortSelect.addEventListener('change', () => {
    // Simple sort logic (placeholder)
    console.log('Sorting by:', sortSelect.value);
  });
}

// Add event listeners to add-to-cart buttons
document.addEventListener('DOMContentLoaded', () => {
  // Initialize promo message cycling (only if element exists)
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
    // Start cycling every 5 seconds
    setInterval(showNextPromo, 5000);
  }
  const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

  addToCartButtons.forEach(button => {
    if (button.dataset.__cartBound) return;
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const btn = event.currentTarget;
      const card = btn.closest('.outfit-card');
      if (!card) return;

      const productId = btn.getAttribute('data-product-id') || btn.dataset.productId || btn.dataset.id;
      const productName = card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : 'Produto';
      const priceEl = card.querySelector('.product-price');
      const priceText = priceEl ? priceEl.textContent : (card.dataset && card.dataset.price ? card.dataset.price : 'R$ 0,00');
      const priceNumber = parseFloat(String(priceText).replace(/[^0-9,\.]/g, '').replace(',', '.')) || 0;
      const imgEl = card.querySelector('img.product-card-img') || card.querySelector('img');
      const imgSrc = imgEl ? imgEl.getAttribute('src') : '';

      try {
        // Disable button during processing and preserve label
        const originalLabel = btn.textContent;
        btn.disabled = true;

        // Try calling adicionarAoCarrinho with id first, fallback to object payload
        if (typeof adicionarAoCarrinho === 'function') {
          try {
            // some implementations expect just the id/string
            await adicionarAoCarrinho(productId);
          } catch (err) {
            // fallback to object form used elsewhere
            await adicionarAoCarrinho({ id: productId, nome: productName, preco: priceNumber, quantidade: 1, imagem: imgSrc });
          }
        } else {
          console.warn('adicionarAoCarrinho is not defined');
        }

        // Visual feedback
        btn.textContent = 'Adicionado!';
        setTimeout(() => {
          btn.textContent = originalLabel || 'Adicionar ao Carrinho';
          btn.disabled = false;
        }, 2000);
      } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
        const originalLabel = btn.textContent;
        btn.textContent = 'Erro!';
        setTimeout(() => {
          btn.textContent = originalLabel || 'Adicionar ao Carrinho';
          btn.disabled = false;
        }, 2000);
      }
    });
    button.dataset.__cartBound = '1';
  });

  // Update cart count (support both function names)
  if (typeof updateCartCount === 'function') {
    try { updateCartCount(); } catch (e) { console.warn(e); }
  }
  if (typeof atualizarContadorCarrinho === 'function') {
    try { atualizarContadorCarrinho(); } catch (e) { console.warn(e); }
  }

  // Ensure cart button opens modal (fallback if cart.js didn't bind)
  const cartBtn = document.getElementById('cart-button');
  if (cartBtn) {
    cartBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (typeof mostrarCarrinho === 'function') {
        mostrarCarrinho();
        return;
      }
      if (typeof openCartModal === 'function') {
        openCartModal();
        return;
      }
      const fake = document.querySelector('a[data-cart]');
      if (fake) fake.click();
    });
  }

  // Image placeholder: add `loaded` class when product images finish loading
  const productImages = document.querySelectorAll('img.product-card-img');
  productImages.forEach(img => {
    function markLoaded() {
      try {
        img.classList.add('loaded');
        const parent = img.closest('.product-link');
        if (parent) parent.style.animation = 'none'; // stop shimmer once loaded
      } catch (e) { console.warn(e); }
    }

    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
    } else {
      img.addEventListener('load', markLoaded);
      img.addEventListener('error', () => {
        // keep placeholder background if image failed
        img.classList.remove('loaded');
      });
    }
  });
});
