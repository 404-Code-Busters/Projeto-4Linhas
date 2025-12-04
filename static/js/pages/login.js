/**
 * login.js
 * Gerencia o formulário de login com AJAX
 * Intercepta erros e exibe notificações elegantes sem redirecionar
 */

(function() {
  'use strict';

  // Função para exibir notificação de erro
  function showErrorNotification(message) {
    // Remove notificação anterior se existir
    const existingNotification = document.getElementById('login-error-notification');
    if (existingNotification) {
      existingNotification.classList.add('removing');
      setTimeout(() => existingNotification.remove(), 300);
    }

    // Cria nova notificação
    const notification = document.createElement('div');
    notification.id = 'login-error-notification';
    notification.className = 'login-error-notification';
    notification.setAttribute('role', 'alert');
    notification.innerHTML = `
      <div class="error-content">
        <span class="error-icon">✕</span>
        <span class="error-message">${message}</span>
        <button class="error-close" type="button" aria-label="Fechar notificação">&times;</button>
      </div>
    `;

    // Insere a notificação no início da página
    const mainContent = document.querySelector('main') || document.body;
    mainContent.insertBefore(notification, mainContent.firstChild);

    // Limpa o campo de senha
    const senhaInput = document.querySelector('input[name="senha"]');
    if (senhaInput) {
      senhaInput.value = '';
      senhaInput.focus();
    }

    // Adiciona evento para fechar
    const closeBtn = notification.querySelector('.error-close');
    closeBtn.addEventListener('click', function() {
      notification.classList.add('removing');
      setTimeout(() => notification.remove(), 300);
    });

    // Auto-remove após 5 segundos
    setTimeout(function() {
      if (notification.parentNode) {
        notification.classList.add('removing');
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);

    // Scroll para a notificação com offset
    setTimeout(() => {
      notification.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  // Interceptar o formulário de login
  const loginForm = document.querySelector('.login-box form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const email = loginForm.querySelector('input[name="email"]').value.trim();
      const senha = loginForm.querySelector('input[name="senha"]').value;

      // Validação básica
      if (!email || !senha) {
        showErrorNotification('Por favor, preencha todos os campos.');
        return;
      }

      try {
        // Enviar formulário via AJAX com redirect: 'follow'
        const formData = new FormData(loginForm);
        
        console.log('Enviando dados de login...');
        const response = await fetch('/login', {
          method: 'POST',
          body: formData,
          redirect: 'follow'  // Permite que o fetch siga redirects
        });

        console.log('Status da resposta:', response.status);
        console.log('URL final:', response.url);

        // Se conseguiu seguir o redirect (login bem-sucedido)
        if (response.url && (response.url.includes('/perfil') || response.url.includes('/admin'))) {
          console.log('Login bem-sucedido! Redirecionando para:', response.url);
          window.location.href = response.url;
          return;
        }

        // Se a resposta é 200 OK com HTML, pode ser a página de login novamente (erro)
        if (response.status === 200) {
          const contentType = response.headers.get('content-type');
          
          // Se é HTML, tenta pegar a página
          if (contentType && contentType.includes('text/html')) {
            // Se conseguimos chegar aqui significa que não foi redirecionado
            showErrorNotification('Erro ao fazer login. Tente novamente.');
            return;
          }

          // Se é JSON, tenta extrair mensagem de erro
          try {
            const data = await response.json();
            if (data.mensagem) {
              showErrorNotification(data.mensagem);
            } else {
              showErrorNotification('Erro ao fazer login. Tente novamente.');
            }
            return;
          } catch (jsonError) {
            showErrorNotification('Erro ao fazer login. Tente novamente.');
            return;
          }
        }

        // Para qualquer outro status
        showErrorNotification('Erro ao fazer login. Tente novamente.');

      } catch (error) {
        console.error('Erro na requisição de login:', error);
        showErrorNotification('Erro na conexão. Verifique sua internet e tente novamente.');
      }
    });
  }

})();
