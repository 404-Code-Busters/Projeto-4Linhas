/**
 * auth-modal.js
 *
 * Responsável por exibir um modal genérico para erros de autenticação,
 * como sessão expirada.
 */

/**
 * Cria e exibe um modal informando que a sessão expirou.
 * A função injeta o HTML do modal no corpo da página e o torna visível.
 */
function showSessionExpiredModal() {
  // Evita criar múltiplos modais se a função for chamada várias vezes rapidamente.
  if (document.getElementById('auth-modal-overlay')) {
    return;
  }

  const modalHTML = `
    <div id="auth-modal-overlay" class="auth-modal-overlay">
      <div class="auth-modal-box">
        <h2>Sessão Expirada</h2>
        <p>Seu tempo de acesso terminou. Por favor, faça o login novamente para continuar.</p>
        <a href="/login" class="auth-modal-btn">Ir para Login</a>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Adiciona a classe para ativar a transição de fade-in após o elemento ser adicionado ao DOM.
  setTimeout(() => {
    document.getElementById('auth-modal-overlay').classList.add('is-visible');
  }, 10);
}