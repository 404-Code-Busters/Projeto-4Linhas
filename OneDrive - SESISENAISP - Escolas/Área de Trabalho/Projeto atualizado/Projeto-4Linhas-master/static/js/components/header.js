// Header-specific behaviors extracted from pages/home.js
// This file handles: promo cycling, hamburger toggle, search modal, benefits dropdown,
// scroll handler (toggles `body.scrolled`), scroll-to-top button and cart count update.

(function(){
	// Scroll handler: toggle `body.scrolled` class
	window.addEventListener('scroll', () => {
		if (window.scrollY > 50) {
			document.body.classList.add('scrolled');
		} else {
			document.body.classList.remove('scrolled');
		}
	});

	document.addEventListener('DOMContentLoaded', function() {
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
				mobileMenu.style.display = mobileMenu.style.display === 'block' ? 'none' : 'block';
			});

			// Close menu when clicking outside
			mobileMenu.addEventListener('click', (e) => {
				if (e.target === mobileMenu) {
					mobileMenu.style.display = 'none';
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
					searchModal.style.display = 'flex';
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
				// Robust fallback: if some CSS prevents visibility, force inline styles when open
				if (isDropdownOpen) {
					benefitsDropdown.style.opacity = '1';
					benefitsDropdown.style.visibility = 'visible';
					benefitsDropdown.style.transform = 'translateY(0)';
					benefitsDropdown.style.pointerEvents = 'auto';
				} else {
					// remove inline styles to fall back to CSS transitions
					benefitsDropdown.style.opacity = '';
					benefitsDropdown.style.visibility = '';
					benefitsDropdown.style.transform = '';
					benefitsDropdown.style.pointerEvents = '';
				}
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

		// Update cart count if function exists (cart.js provides updateCartCount)
		try { if (typeof updateCartCount === 'function') updateCartCount(); } catch (err) { /* ignore */ }

		// Ensure cart button opens the cart modal like on home page
		const cartBtn = document.getElementById('cart-button');
		if (cartBtn) {
			cartBtn.addEventListener('click', function(e) {
				e.preventDefault();
				// Try to open modal via known functions, fallback to any anchor that cart.js may bind
				try { if (typeof openCartModal === 'function') return openCartModal(); } catch (err) { /* ignore */ }
				try { if (typeof mostrarCarrinho === 'function') return mostrarCarrinho(); } catch (err) { /* ignore */ }
				const fake = document.querySelector('a[data-cart]');
				if (fake) { fake.click(); }
			});
		}

		// Scroll to top button
		const scrollToTopBtn = document.querySelector('.scroll-to-top');
		if (scrollToTopBtn) {
			scrollToTopBtn.addEventListener('click', () => {
				window.scrollTo({ top: 0, behavior: 'smooth' });
			});
		}
	});
})();
