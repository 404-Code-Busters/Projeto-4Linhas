(function() {
  // Promo message initialization will run on DOMContentLoaded to avoid duplicate globals

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

  // Thumbnail switching: attach on DOMContentLoaded to ensure elements exist
  document.addEventListener('DOMContentLoaded', function() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.querySelector('.product-image-main');

    if (thumbnails && thumbnails.length > 0 && mainImage) {
      thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
          thumbnails.forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
          const thumbSrc = thumb.getAttribute('src') || thumb.src || '';
          if (thumbSrc) mainImage.setAttribute('src', thumbSrc);
        });
      });
    }
  });

  // Add to cart functionality
  const addToCartBtn = document.querySelector('.add-to-cart');
  if (addToCartBtn) {
    if (!addToCartBtn.dataset.__cartBound) {
      addToCartBtn.addEventListener('click', () => {
      const titleEl = document.querySelector('.product-title');
      const priceEl = document.querySelector('.product-price');
      const imgEl = document.querySelector('.product-image-main');
      const productTitle = titleEl ? titleEl.textContent : 'Produto';
      const productPriceText = priceEl ? priceEl.textContent : 'R$ 0,00';
      const productPrice = parseFloat(productPriceText.replace('R$', '').replace(/[\.\s]/g, '').replace(',', '.')) || 0;
      const imageSrc = imgEl ? imgEl.getAttribute('src') : '';
          try {
            const btn = addToCartBtn;
            const id = btn && (btn.dataset.productId || btn.dataset.id) ? (btn.dataset.productId || btn.dataset.id) : btn.getAttribute('data-product-id');
            adicionarAoCarrinho({ id: id, nome: productTitle, preco: productPrice, quantidade: 1, imagem: imageSrc });
          } catch (e) {
            console.error('adicionarAoCarrinho not available:', e);
          }
      });
      addToCartBtn.dataset.__cartBound = '1';
    }
  }

  // Add to wishlist functionality (placeholder)
  const addToWishlistBtn = document.querySelector('.add-to-wishlist');
  addToWishlistBtn.addEventListener('click', () => {
    alert('Produto adicionado à lista de desejos!');
  });

  // Scroll to top button and show/hide elements on scroll
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
    // Atualiza o contador do carrinho
    updateCartCount();

    const scrollToTopBtn = document.querySelector('.scroll-to-top');
    if (scrollToTopBtn) {
      scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }

    window.addEventListener('scroll', function() {
      const body = document.body;
      if (window.scrollY > 50) {
        body.classList.add('scrolled');
      } else {
        body.classList.remove('scrolled');
      }
    });
  });
})();
