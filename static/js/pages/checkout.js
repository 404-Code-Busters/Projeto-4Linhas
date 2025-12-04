// Small interactions for the checkout flow
// Comments and messages are kept in English per project convention.
document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('checkout-form');
  const steps = ['step-cart','step-address','step-payment','step-confirm'];
  let current = 0;

  function showStep(i){
    current = i;
    steps.forEach((id, idx) => {
      const el = document.getElementById(id);
      if(!el) return;
      el.style.display = (idx === i) ? 'block' : 'none';
    });
    
    // Clear error messages when switching steps
    const paymentError = document.querySelector('[data-error="payment-method"]');
    const addressError = document.querySelector('[data-error="address-method"]');
    if(paymentError) paymentError.style.display = 'none';
    if(addressError) addressError.style.display = 'none';
    
    // update nav
    const nav = document.querySelectorAll('.steps-nav .step');
    nav.forEach((n, idx) => {
      n.classList.remove('active','completed');
      if(idx < i) n.classList.add('completed');
      if(idx === i) n.classList.add('active');
    });

    // Update sidebar button text based on current step
    const sidebarNextBtn = document.querySelector('.sidebar-actions [data-action="next"]');
    const sidebarPrevBtn = document.querySelector('.sidebar-actions [data-action="prev"]');
    
    if (sidebarNextBtn) {
      // On confirmation step (index 3), show "FINALIZAR COMPRA"
      if (i === 3) {
        sidebarNextBtn.textContent = 'FINALIZAR COMPRA';
        sidebarNextBtn.classList.add('submit-action');
      } else {
        sidebarNextBtn.textContent = 'CONTINUAR';
        sidebarNextBtn.classList.remove('submit-action');
      }
    }

    // Show/hide back button based on step
    if (sidebarPrevBtn) {
      sidebarPrevBtn.style.display = (i > 0) ? 'block' : 'none';
    }

    // If showing confirmation step, populate review sections
    if (i === 3) {
      populateReview();
    }
  }

  // Build the confirmation review by reading current cart DOM, selected address and payment
  function populateReview() {
    // CART: clone server-rendered cart list if present
    const cartReview = document.getElementById('review-cart-items');
    const cartSource = document.querySelector('#step-cart .cart-review .cart-items');
    if (cartReview) {
      if (cartSource) {
        // Convert the server-rendered <ul class="cart-items"> into a sequence
        // of card-like <div> elements to avoid list bullets and preserve styles.
        const items = Array.from(cartSource.querySelectorAll('li.cart-item'));
        if (items.length) {
          cartReview.innerHTML = items.map(li => `<div class="cart-item-card">${li.innerHTML}</div>`).join('');
          // Remove any interactive controls (inputs/buttons/anchors) inside the cloned cards
          cartReview.querySelectorAll('input, button, a').forEach(n => n.remove());
        } else {
          cartReview.innerHTML = '<p>Seu carrinho está vazio.</p>';
        }
      } else {
        cartReview.innerHTML = '<p>Seu carrinho está vazio.</p>';
      }
    }

    // ADDRESS: read hidden inputs filled when user selected an address
    const addrContent = document.getElementById('review-address-content');
    if (addrContent) {
      const rua = document.getElementById('rua')?.value || '';
      const numero = document.getElementById('numero')?.value || '';
      const bairro = document.getElementById('bairro')?.value || '';
      const cidade = document.getElementById('cidade')?.value || '';
      const estado = document.getElementById('estado')?.value || '';
      const cep = document.getElementById('cep')?.value || '';

      if (rua || bairro || cidade || cep) {
        addrContent.innerHTML = `
          <div class="review-address-line">${rua} ${numero}</div>
          <div class="review-address-line">${bairro} — ${cidade} / ${estado}</div>
          <div class="review-address-line">CEP: ${cep}</div>
        `;
      } else {
        // If no hidden fields, try to read a selected address radio label
        const selectedAddrRadio = document.querySelector('input[name="selected-address"]:checked');
        if (selectedAddrRadio) {
          // Find the card container and copy its text
          const card = selectedAddrRadio.closest('.saved-address-card');
          addrContent.textContent = card ? card.innerText.trim() : 'Nenhum endereço selecionado';
        } else {
          addrContent.textContent = 'Nenhum endereço selecionado';
        }
      }
    }

    // PAYMENT: read selected payment radio
    const payContent = document.getElementById('review-payment-content');
    if (payContent) {
      const selectedPayment = document.querySelector('input[name="payment"]:checked');
      if (selectedPayment) {
        const val = selectedPayment.value || selectedPayment.getAttribute('value') || '';
        // Try to find a nearby label text
        let labelText = '';
        const parentLabel = selectedPayment.closest('label');
        if (parentLabel) {
          labelText = parentLabel.innerText.replace(/\s+/g, ' ').trim();
        }
        payContent.textContent = labelText || val || 'Método de pagamento selecionado';
      } else {
        payContent.textContent = 'Nenhum método de pagamento selecionado';
      }
    }
  }

  // delegate next/prev buttons - both main and sidebar
  document.querySelectorAll('[data-action="next"]').forEach(b => b.addEventListener('click', async (e) => {
    // For sidebar submit button on confirmation step, trigger form submit instead
    if (current === 3 && b.classList.contains('submit-action')) {
      form.dispatchEvent(new Event('submit'));
      return;
    }

    // Validate address selection before moving to payment
    if(current === 1) { // step-address
      const selectedAddress = document.querySelector('input[name="selected-address"]:checked');
      if(!selectedAddress) {
        const addressError = document.querySelector('[data-error="address-method"]');
        if(addressError) addressError.style.display = 'block';
        return; // Do not advance without an address
      }

      // Calculate freight for selected address before advancing
      try {
        // Prefer hidden input 'cep' if filled (cards set it on click), otherwise try to read from card dataset
        let cep = document.getElementById('cep')?.value || '';
        if(!cep) {
          const card = selectedAddress.closest('.saved-address-card');
          cep = card ? (card.querySelector('.calculate-shipping-btn')?.dataset.cep || '') : '';
        }
        if(cep) {
          // global function defined in checkout.html: calcularFrete
          if(typeof window.calcularFrete === 'function') {
            await window.calcularFrete(cep);
          }
        }
      } catch (err) {
        console.warn('Falha ao calcular frete antes de avançar:', err);
        // allow advance even if freight calc failed
      }
    }

    // Validate payment method when on the payment step
    if(current === 2) { // step-payment index is 2
      const selectedPayment = document.querySelector('input[name="payment"]:checked');
      if(!selectedPayment) {
        // Mostrar mensagem de erro
        const errorNotice = document.querySelector('[data-error="payment-method"]');
        if(errorNotice) {
          errorNotice.style.display = 'block';
        }
        return; // Do not advance without selecting a payment method
      }
    }
    
    // Advance only one step per click
    if(current < steps.length - 1) {
      showStep(current + 1);
    }
  }));

  document.querySelectorAll('[data-action="prev"]').forEach(b => b.addEventListener('click', () => {
    if(current > 0) showStep(current - 1);
  }));

  // on submit, keep confirmation message visible while server processes
  if(form){
    form.addEventListener('submit', async function(e){
      // Re-validate address and payment selection before submit
      if(current === 3) {
        const selectedAddress = document.querySelector('input[name="selected-address"]:checked');
        const selectedPayment = document.querySelector('input[name="payment"]:checked');
        if(!selectedAddress) {
          e.preventDefault();
          const addressError = document.querySelector('[data-error="address-method"]');
          if(addressError) addressError.style.display = 'block';
          // return to address step
          showStep(1);
          return;
        }
        if(!selectedPayment) {
          e.preventDefault();
          const paymentError = document.querySelector('[data-error="payment-method"]');
          if(paymentError) paymentError.style.display = 'block';
          showStep(2);
          return;
        }
      }

      // Only submit when on confirmation step
      if(current !== 3){
        e.preventDefault();
        return;
      }

      // Prevent default and submit via fetch so we can follow server redirects
      e.preventDefault();
      console.log('Submitting checkout via fetch...');
      const review = document.querySelector('#step-confirm .review-summary');
      if(review) review.innerHTML = '<p>Processando pagamento e finalizando seu pedido...</p>';

      try {
        const formData = new FormData(form);
        const action = form.getAttribute('action') || window.location.pathname;
        const resp = await fetch(action, {
          method: 'POST',
          body: formData,
          credentials: 'same-origin',
          redirect: 'follow'
        });

        // If server redirected (e.g. to /pedidos/confirmacao), follow it in the browser
        if (resp.redirected) {
          console.log('Server redirected to', resp.url);
          window.location.href = resp.url;
          return;
        }

        // If not redirected, server returned HTML (likely the checkout page with errors)
        const text = await resp.text();
        // Replace the document with the server response so user sees errors/confirmation
        document.open();
        document.write(text);
        document.close();
      } catch (err) {
        console.error('Checkout submit failed:', err);
        if (window.showToast) window.showToast('Ocorreu um erro ao processar o pedido. Tente novamente.', 'error');
      }
    });
  }

  // Check if coming from profile cart form
  const fromProfileInput = document.querySelector('input[name="from_profile"]');
  const fromProfile = fromProfileInput && fromProfileInput.value === 'true';

  // initial state: check server error and open the appropriate step
  const serverErrEl = document.getElementById('server-error');
  // Debug: log origin and server error (if any)
  console.log('From Profile:', fromProfile);
  console.log('Server Error Element:', serverErrEl);
  if (serverErrEl && serverErrEl.dataset && serverErrEl.dataset.error && serverErrEl.dataset.error.trim() !== '') {
    const msg = serverErrEl.dataset.error.trim();
    const lower = msg.toLowerCase();

    // helper to check for keywords in multiple languages
    const containsAny = (text, keywords) => keywords.some(k => text.includes(k));
    const paymentKeywords = ['pagamento','finalize','finalizar','payment','finalize','complete'];
    const addressKeywords = ['endereço','endereco','nenhum endereço','nenhum endereco','address','no address','no-address'];

    // If from profile, always start at cart step to let user review cart first
    if (fromProfile) {
      showStep(0);
      // Still attach the server message to the relevant field so user can see it after reviewing
      if (containsAny(lower, paymentKeywords)) {
        const paymentError = document.querySelector('[data-error="payment-method"]');
        if (paymentError) { paymentError.textContent = msg; }
      } else if (containsAny(lower, addressKeywords)) {
        const addressError = document.querySelector('[data-error="address-method"]');
        if (addressError) { addressError.textContent = msg; }
      }
    } else {
      // Default behavior: navigate to the step related to the server error
      if (containsAny(lower, paymentKeywords)) {
        const paymentError = document.querySelector('[data-error="payment-method"]');
        if (paymentError) { paymentError.textContent = msg; paymentError.style.display = 'block'; }
        showStep(2);
      } else if (containsAny(lower, addressKeywords)) {
        const addressError = document.querySelector('[data-error="address-method"]');
        if (addressError) { addressError.textContent = msg; addressError.style.display = 'block'; }
        showStep(1);
      } else {
        // fallback: log and show cart
        console.warn('Server error:', msg);
        showStep(0);
      }
    }
  } else {
    showStep(0);
  }

  // Observe subtotal changes and flash when it changes
  try {
    const totalEl = document.getElementById('total-final');
    if (totalEl) {
      let lastText = totalEl.innerText;
      const flash = () => {
        totalEl.classList.add('subtotal-flash');
        setTimeout(() => totalEl.classList.remove('subtotal-flash'), 1000);
      };

      const mo = new MutationObserver(muts => {
        const cur = totalEl.innerText;
        if (cur !== lastText) {
          lastText = cur;
          flash();
        }
      });
      mo.observe(totalEl, { characterData: true, subtree: true, childList: true });
    }
  } catch (e) {
    console.warn('Subtotal observer failed', e);
  }
});
