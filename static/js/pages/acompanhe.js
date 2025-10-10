// Promo messages cycling
// Promo messages cycling will initialize on DOMContentLoaded to avoid duplicate globals
document.addEventListener('DOMContentLoaded', () => {
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

});

// Funcionalidade do botão voltar ao topo
const scrollToTopButton = document.querySelector('.scroll-to-top');
const topLogo = document.querySelector('.top-logo');

window.addEventListener('scroll', () => {
  if (window.scrollY > 100) {
    document.body.classList.add('scrolled');
    topLogo.style.opacity = '1';
  } else {
    document.body.classList.remove('scrolled');
    topLogo.style.opacity = '0';
  }
});

if (scrollToTopButton) {
  scrollToTopButton.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// Funcionalidade do dropdown de benefícios
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

  // Fechar o dropdown quando clicar fora dele
  document.addEventListener('click', (e) => {
    if (!promoArrow.contains(e.target) && !benefitsDropdown.contains(e.target) && isDropdownOpen) {
      isDropdownOpen = false;
      benefitsDropdown.classList.remove('active');
      promoArrow.style.transform = 'rotate(0deg)';
    }
  });

  // Fechar com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isDropdownOpen) {
      isDropdownOpen = false;
      benefitsDropdown.classList.remove('active');
      promoArrow.style.transform = 'rotate(0deg)';
    }
  });
}

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
