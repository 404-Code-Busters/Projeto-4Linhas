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
  const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

  addToCartButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      const card = event.target.closest('.outfit-card');
      if (!card) return;

      const productName = card.querySelector('h3') ? card.querySelector('h3').textContent : 'Produto';
      const priceText = card.querySelector('p') ? card.querySelector('p').textContent : 'R$ 0,00';
      const priceNumber = parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.')) || 0;

      adicionarAoCarrinho(productName, priceNumber);
    });
  });

  // Update cart count
  updateCartCount();
});
