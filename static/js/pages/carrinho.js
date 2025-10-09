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
  // Load cart
  mostrarCarrinho();

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
