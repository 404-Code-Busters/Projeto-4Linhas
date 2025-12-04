// Indicador simples de força de senha
(function(){
  const pwd = document.getElementById('senha');
  const meter = document.getElementById('password-meter-bar');
  const hint = document.getElementById('password-hint');
  const form = document.getElementById('register-form');

  function scorePassword(s){
    let score = 0;
    if (!s) return 0;
    if (s.length >= 8) score += 1;
    if (/[A-Z]/.test(s)) score += 1;
    if (/[0-9]/.test(s)) score += 1;
    if (/[^A-Za-z0-9]/.test(s)) score += 1;
    if (s.length >= 12) score += 1;
    return score; // 0..5
  }

  function updateMeter(){
    const val = pwd.value || '';
    const s = scorePassword(val);
    const pct = (s / 5) * 100;
    meter.style.width = pct + '%';
    meter.style.background = s <= 1 ? '#e74c3c' : s <= 3 ? '#f1c40f' : '#2ecc71';
    if (val.length === 0) hint.textContent = 'Use ao menos 8 caracteres, incluindo letras e números.';
    else if (s <= 1) hint.textContent = 'Senha fraca';
    else if (s <= 3) hint.textContent = 'Senha média';
    else hint.textContent = 'Senha forte';
  }

  pwd && pwd.addEventListener('input', updateMeter);

  form && form.addEventListener('submit', (e)=>{
    const a = pwd.value || '';
    const b = document.getElementById('confirmar').value || '';
    if (a !== b){
        e.preventDefault();
        if (window.showToast) window.showToast('As senhas não coincidem.', 'error');
      return false;
    }
    if (scorePassword(a) < 2){
        e.preventDefault();
        if (window.showToast) window.showToast('Escolha uma senha mais forte.', 'error');
      return false;
    }
  });
})();
