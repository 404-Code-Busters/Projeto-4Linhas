// Header-specific behaviors extracted from pages/home.js
// This file handles: promo cycling, hamburger toggle, search modal, benefits dropdown,
// scroll handler (toggles `body.scrolled`), scroll-to-top button and cart count update.

(function(){
	// Debug: header module loaded
	try { console.log('[header.js] module loaded'); } catch(e) {}

	// Throttled Scroll handler: toggle `body.scrolled` class for better performance
	let isThrottled = false;
	const scrollThreshold = 50;

	function handleScroll() {
		// Use classList.toggle for simpler logic
		document.body.classList.toggle('scrolled', window.scrollY > scrollThreshold);
	}

	window.addEventListener('scroll', () => {
		if (!isThrottled) {
			window.requestAnimationFrame(() => {
				handleScroll();
				isThrottled = false;
			});
			isThrottled = true;
		}
	});
	// Initial check in case the page loads already scrolled
	handleScroll();

	document.addEventListener('DOMContentLoaded', function() {
		// Debug: DOMContentLoaded (header.js)
		try { console.log('[header.js] DOMContentLoaded'); } catch(e) {}
		// Promo messages cycling
		const promoMessage = document.querySelector('.promo-message');
		const messages = ['30% OFF em toda a loja', '4linhas para tudo e todos', 'Frete grátis acima de R$100', 'Novidades toda semana'];
		let currentPromo = 0;

		function showNextPromo() {
			if (!promoMessage) return;
			promoMessage.style.opacity = 0;
			setTimeout(() => {
				currentPromo = (currentPromo + 1) % messages.length;
				promoMessage.textContent = messages[currentPromo];
				promoMessage.style.opacity = 1;
			}, 500);
		}

		// Start cycling every 5 seconds
		if (promoMessage) setInterval(showNextPromo, 5000);

		// Hamburger menu toggle
		const hamburger = document.querySelector('.hamburger');
		const mobileMenu = document.querySelector('.mobile-menu');

		if (hamburger && mobileMenu) {
			hamburger.addEventListener('click', () => {
				// Use a class on the body to toggle the menu. This is more flexible for styling.
				document.body.classList.toggle('menu-open');
			});

			// Close menu when clicking outside
			mobileMenu.addEventListener('click', (e) => {
				if (e.target === mobileMenu) {
					document.body.classList.remove('menu-open');
				}
			});
		}

// Search behavior: prefer modal if present, otherwise focus the page search input
const searchButton = document.querySelector('.search-button');
const searchModal = document.getElementById('search-modal');
const closeModal = document.querySelector('.close-modal');

if (searchButton) {
  searchButton.addEventListener('click', (e) => {
    // If a dedicated search modal exists, use it (legacy behavior)
    if (searchModal && closeModal) {
      searchModal.classList.add('is-open');
      return;
    }
    // Otherwise, try to focus an in-page search input (#search-input)
    const pageSearch = document.getElementById('search-input');
    if (pageSearch) {
      // Make sure it's visible (some pages may hide it), scroll into view and focus
      pageSearch.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(() => pageSearch.focus(), 300);
      return;
    }
    // Fallback: toggle a compact inline search field in the header if present
    const headerSearch = document.querySelector('.header-inline-search');
    if (headerSearch) {
      headerSearch.classList.toggle('open');
      const input = headerSearch.querySelector('input');
      if (input && headerSearch.classList.contains('open')) input.focus();
    }
  });

  // If modal exists, wire close behavior too
  if (searchModal && closeModal) {
    closeModal.addEventListener('click', () => {
      searchModal.classList.remove('is-open');
    });
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === searchModal) {
        searchModal.classList.remove('is-open');
      }
    });
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchModal.classList.contains('is-open')) {
        searchModal.classList.remove('is-open');
      }
    });
  }
}

		// Dropdown de benefícios (login/cadastro)
		const promoArrow = document.querySelector('.promo-arrow');
		const benefitsDropdown = document.querySelector('.benefits-dropdown');
		const userDropdown = document.querySelector('.user-dropdown');
		const activeDropdown = benefitsDropdown || userDropdown; // Pega o dropdown que existir na página

		if (promoArrow && activeDropdown) {
			try { console.log('[header.js] promoArrow & activeDropdown found', {promoArrow, activeDropdown}); } catch(e) {}
			const toggleDropdown = (e) => {
				e.stopPropagation();
				const isActive = activeDropdown.classList.toggle('active');
				promoArrow.style.transform = isActive ? 'rotate(180deg)' : 'rotate(0deg)';
			};

			const closeDropdown = () => {
				activeDropdown.classList.remove('active');
				promoArrow.style.transform = 'rotate(0deg)';
			};

			promoArrow.addEventListener('click', (e) => { try { console.log('[header.js] promoArrow click'); } catch(err){}; toggleDropdown(e); });

			// Fecha o dropdown ao clicar fora
			document.addEventListener('click', (e) => {
				if (activeDropdown.classList.contains('active') && !promoArrow.contains(e.target) && !activeDropdown.contains(e.target)) {
					closeDropdown();
				}
			});

			// Fecha com ESC
			document.addEventListener('keydown', (e) => {
				if (e.key === 'Escape' && activeDropdown.classList.contains('active')) {
					closeDropdown();
				}
			});
		}

		// Update cart count if function exists (cart.js provides updateCartCount)
		try { if (typeof updateCartCount === 'function') updateCartCount(); } catch (err) { /* ignore */ }

		// Use event delegation to reliably handle cart icon clicks across pages
		// This avoids problems when scripts load in different orders or when
		// elements are covered by overlays on specific pages (ex: home hero).
		document.addEventListener('click', function(e) {
			const cartIcon = e.target.closest('#cart-button, .cart-button');
			if (!cartIcon) return;
			e.preventDefault();
			// Prefer a page-local open function, then the global mostrarCarrinho
			try { if (typeof openCartModal === 'function') { openCartModal(); return; } } catch (err) { /* ignore */ }
			try { if (typeof mostrarCarrinho === 'function') { mostrarCarrinho(); return; } } catch (err) { /* ignore */ }
			const fake = document.querySelector('a[data-cart]');
			if (fake) { fake.click(); }
		});

		// Scroll to top button
		const scrollToTopBtn = document.querySelector('.scroll-to-top');
		if (scrollToTopBtn) {
			scrollToTopBtn.addEventListener('click', () => {
				window.scrollTo({ top: 0, behavior: 'smooth' });
			});
		}
	});
})();


// TRADUZR PARA O COMPREENSÃO IMEDIATA E PARA ALTERAÇÕES FUTURAS!!!
