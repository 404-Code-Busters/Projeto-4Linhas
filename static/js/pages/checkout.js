// small interactions for checkout step
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
    // update nav
    const nav = document.querySelectorAll('.steps-nav .step');
    nav.forEach((n, idx) => {
      n.classList.remove('active','completed');
      if(idx < i) n.classList.add('completed');
      if(idx === i) n.classList.add('active');
    });
  }

  // delegate next/prev buttons
  document.querySelectorAll('[data-action="next"]').forEach(b => b.addEventListener('click', () => {
    // Avança apenas uma etapa por clique, nunca pula direto para confirmação
    if(current < steps.length - 2) {
      showStep(current + 1);
    }
    // Só permite submit na etapa de pagamento
    // O submit é tratado no botão de pagamento (type="submit")
  }));

  document.querySelectorAll('[data-action="prev"]').forEach(b => b.addEventListener('click', () => {
    if(current > 0) showStep(current - 1);
  }));

  // on submit, keep confirmation message visible while server processes
  if(form){
    form.addEventListener('submit', function(e){
      // Só permite submit se estiver na etapa de pagamento
      if(current !== 2){
        e.preventDefault();
        return;
      }
      // Mostra etapa de confirmação e só então envia
      showStep(3);
      setTimeout(() => {
        form.submit();
      }, 600);
    });
  }

  // initial state
  showStep(0);
});
