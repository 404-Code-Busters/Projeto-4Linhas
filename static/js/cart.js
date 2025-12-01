/**
 * Alteração Gemini: Verifica a resposta da API e mostra o modal de sessão expirada se for 401.
 * Esta função agora chama um handler global de autenticação.
 * @param {Response} response - O objeto de resposta do fetch.
 * @returns {boolean} - Retorna true se a sessão expirou, caso contrário false.
 */
function handleAuthError(response) {
  if (response.status === 401) {
    // Verifica se a função global do modal de autenticação existe antes de chamar.
    if (typeof showSessionExpiredModal === 'function') {
      showSessionExpiredModal();
    }
    return true; // Indica que um erro de autenticação foi tratado.
  }
  return false;
}

/**
 * cart.js
 *
 * Este script JavaScript é responsável por gerenciar a funcionalidade do modal do carrinho de compras.
 * Ele interage diretamente com o backend para buscar, adicionar, remover e atualizar itens do carrinho,
 * garantindo que a interface do usuário seja dinâmica e reflita o estado atual do carrinho no servidor.
 *
 * Principais funcionalidades:
 * - Criação e gerenciamento de um modal de carrinho dinâmico.
 * - Busca de itens do carrinho do servidor via `/carrinho/itens`.
 * - Tratamento de autenticação (redirecionamento para login se não autenticado).
 * - Adição, remoção e atualização da quantidade de produtos via chamadas assíncronas à API.
 * - Atualização do contador de itens do carrinho no cabeçalho.
 * - Gerenciamento de eventos de clique para botões de "Adicionar ao Carrinho" e o ícone do carrinho.
 */

// ---------- UI: Funções do Modal do Carrinho ----------

/**
 * Cria e/ou busca o elemento base do modal do carrinho.
 * Garante que o modal exista no DOM para ser preenchido.
 */
function getOrCreateCartModal() {
    let modal = document.getElementById('cart-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cart-modal';
        modal.className = 'cart-modal';
        modal.innerHTML = `
            <div class="cart-modal-backdrop"></div>
            <div class="cart-modal-panel">
                <div class="cart-modal-header">
                    <h2 class="cart-modal-title">Seu Carrinho</h2>
                    <button class="cart-modal-close" aria-label="Fechar">&times;</button>
                </div>
                <div class="cart-items"></div>
                <div class="cart-total" style="margin-top: 1rem; font-weight: 700; text-align: right;"></div>
                <div class="cart-actions">
                    <a href="/perfil#cart" class="cart-checkout">Finalizar compra</a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        // Adiciona listeners para fechar o modal ao clicar no botão de fechar ou no pano de fundo.
        modal.querySelector('.cart-modal-close').addEventListener('click', () => closeCartModal());
        modal.querySelector('.cart-modal-backdrop').addEventListener('click', () => closeCartModal());
    }
    return modal;
}

/**
 * Renderiza o conteúdo do modal do carrinho com base nos dados recebidos.
 * @param {object} data - Objeto contendo `itens` e `total`.
 */
function renderCartModal(data) {
    const modal = getOrCreateCartModal();
    const container = modal.querySelector('.cart-items');
    const totalContainer = modal.querySelector('.cart-total');
    const checkoutButton = modal.querySelector('.cart-checkout');

    container.innerHTML = ''; // Limpa qualquer conteúdo anterior do modal

    // Verifica se o carrinho está vazio e exibe uma mensagem apropriada.
    if (!data || !data.itens || data.itens.length === 0) {
        container.innerHTML = '<p>Seu carrinho está vazio.</p>';
        totalContainer.innerHTML = '';
        checkoutButton.style.display = 'none'; // Esconde o botão de finalizar compra
    } else {
        // Itera sobre cada item do carrinho para criar sua representação HTML.
        data.itens.forEach(item => {
            const row = document.createElement('div');
            row.className = 'cart-item-row';
            // Calcula o total para o item atual.
            const itemTotal = (Number(item.preco) || 0) * (Number(item.quantidade) || 0);
            row.innerHTML = `
                <img src="/static/upload/img/${item.imagem || 'assets/logo/4linhas-bg-red.svg'}" alt="${item.nome || ''}" class="cart-item-img">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.nome || ''}</div>
                    <div class="cart-item-price">R$ ${itemTotal.toFixed(2).replace('.', ',')}</div>
                    <div class="cart-item-qty">
                        Qtd: 
                        <button class="qty-decr" data-id="${item.id}">-</button> 
                        <span class="qty-value">${Number(item.quantidade || 0)}</span> 
                        <button class="qty-incr" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" data-id="${item.id}">Remover</button>
            `;
            container.appendChild(row);
        });

        // Exibe o total geral do carrinho.
        totalContainer.textContent = `Total: R$ ${Number(data.total || 0).toFixed(2).replace('.', ',')}`;
        checkoutButton.style.display = 'block'; // Garante que o botão de finalizar compra esteja visível

        // Anexa os event listeners aos botões de remover e de ajuste de quantidade para os novos elementos criados.
        container.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => removerDoCarrinho(e.currentTarget.dataset.id));
        });
        container.querySelectorAll('.qty-incr').forEach(btn => {
            btn.addEventListener('click', (e) => atualizarQuantidade(e.currentTarget.dataset.id, 1));
        });
        container.querySelectorAll('.qty-decr').forEach(btn => {
            btn.addEventListener('click', (e) => atualizarQuantidade(e.currentTarget.dataset.id, -1));
        });
    }
}

/**
 * Exibe uma mensagem no modal (ex: para fazer login).
 * @param {string} message - A mensagem a ser exibida.
 * @param {boolean} showLoginButton - Se deve mostrar um botão de login.
 */
function renderCartMessage(message, showLoginButton = false) {
    const modal = getOrCreateCartModal();
    const container = modal.querySelector('.cart-items');
    const totalContainer = modal.querySelector('.cart-total');
    const checkoutButton = modal.querySelector('.cart-checkout');

    container.innerHTML = `<p>${message}</p>`; // Define a mensagem principal
    totalContainer.innerHTML = ''; // Limpa o total
    checkoutButton.style.display = 'none'; // Esconde o botão de finalizar compra

    // Se solicitado, cria e exibe um botão para o usuário fazer login.
    if (showLoginButton) {
        const loginBtn = document.createElement('a');
        loginBtn.href = '/login';
        loginBtn.className = 'cart-checkout';
        loginBtn.textContent = 'Fazer Login';
        loginBtn.style.display = 'block';
        loginBtn.style.marginTop = '1rem';
        container.appendChild(loginBtn);
    }
}

/**
 * Abre o modal e busca os dados do carrinho no servidor.
 */
async function mostrarCarrinho() {
    const modal = getOrCreateCartModal();
    modal.classList.add('open'); // Adiciona a classe 'open' para exibir o modal (geralmente via CSS)
    renderCartMessage('Carregando...'); // Exibe uma mensagem de carregamento para feedback imediato

    try {
        // Faz a requisição para o endpoint do carrinho, incluindo credenciais para sessões.
        const response = await fetch('/carrinho/itens', { credentials: 'same-origin' });

        // Se a resposta for 401 (Não Autorizado), significa que o usuário não está logado.
        // Alteração Gemini: Usa a nova função para tratar o erro 401
        if (handleAuthError(response)) {
            return;
        }

        // Se a resposta não for bem-sucedida (ex: 500 Internal Server Error), lança um erro.
        if (!response.ok) {
            throw new Error('Falha ao buscar o carrinho.');
        }

        const data = await response.json(); // Converte a resposta para JSON
        renderCartModal(data); // Renderiza o conteúdo do carrinho no modal com os dados recebidos

    } catch (error) {
        // Captura e exibe erros que ocorram durante a busca ou processamento.
        console.error('Erro ao buscar carrinho:', error);
        renderCartMessage('Ocorreu um erro ao carregar seu carrinho.');
    }
}

/**
 * Fecha visualmente o modal do carrinho, removendo a classe 'open'.
 */
function closeCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) modal.classList.remove('open');
}

// ---------- Funções de Interação com o Backend ----------

/**
 * Atualiza o contador de itens do carrinho no header.
 */
async function atualizarContadorCarrinho() {
    try {
        const response = await fetch('/carrinho/contador', { credentials: 'same-origin' });
        const cartCountEl = document.getElementById('cart-count'); // Elemento onde o contador é exibido

        if (!cartCountEl) return; // Se o elemento do contador não existe, não faz nada.

        // Se a resposta não for bem-sucedida, define o contador como 0 e o esconde.
        if (!response.ok) {
            cartCountEl.textContent = '0';
            cartCountEl.style.display = 'none';
            return;
        }

        const data = await response.json(); // Espera a resposta JSON que contém a quantidade.
        const count = data.quantidade || 0; // Pega a quantidade ou 0 se não definida.
        cartCountEl.textContent = count; // Atualiza o texto do contador.
        // Exibe o contador apenas se houver itens no carrinho.
        cartCountEl.style.display = count > 0 ? 'inline-flex' : 'none';

    } catch (error) {
        console.error('Erro ao atualizar contador:', error);
        // Em caso de erro, garante que o contador seja 0 ou oculto para evitar informações incorretas.
        const cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) {
            cartCountEl.textContent = '0';
            cartCountEl.style.display = 'none';
        }
    }
}

/**
 * Adiciona um item ao carrinho no backend.
 * @param {string|number} produtoId - O ID do produto a ser adicionado.
 */
async function adicionarAoCarrinho(itemOrId) {
    try {
        // Extrai o ID do produto, seja de um ID direto ou de um objeto.
        const produtoId = (typeof itemOrId === 'object') ? itemOrId.id : itemOrId;
        if (!produtoId) return; // Sai se o ID do produto não for válido.

        // Envia uma requisição POST para adicionar o item ao carrinho.
        const response = await fetch(`/carrinho/adicionar/${produtoId}`, { method: 'POST', credentials: 'same-origin' });
        // Se o usuário não estiver autenticado, redireciona para a página de login.
        // Alteração Gemini: Usa a nova função para tratar o erro 401
        if (handleAuthError(response)) {
            return;
        }
        // Se a requisição não foi bem-sucedida, lança um erro.
        if (!response.ok) throw new Error('Falha ao adicionar item.');

        await atualizarContadorCarrinho();
        // Após adicionar com sucesso, atualiza o contador e reabre o modal do carrinho para feedback visual.
        await mostrarCarrinho();

    } catch (e) {
        console.error('Erro adicionarAoCarrinho:', e);
        // Poderia adicionar um feedback visual para o usuário aqui, como um toast de erro.
    }
}

/**
 * Remove um item do carrinho no backend e atualiza o modal.
 * @param {string|number} produtoId - O ID do produto a ser removido.
 */
async function removerDoCarrinho(produtoId) {
    try {
        // Envia uma requisição POST para remover o item do carrinho.
        const resp = await fetch(`/carrinho/remover/${produtoId}`, { method: 'POST', credentials: 'same-origin' });

        // Alteração Gemini: Trata erro de autenticação
        if (handleAuthError(resp)) {
            return;
        }

        // Se a requisição não foi bem-sucedida, lança um erro.
        if (!resp.ok) throw new Error('Falha ao remover item.');

        // Após remover com sucesso, atualiza o contador e reabre o modal do carrinho.
        await atualizarContadorCarrinho();
        await mostrarCarrinho();

    } catch (e) {
        console.error('Erro removerDoCarrinho:', e);
        // Feedback de erro para o usuário.
    }
}

/**
 * Altera a quantidade de um item no carrinho.
 * @param {string|number} produtoId - O ID do produto.
 * @param {number} delta - A mudança na quantidade (+1 ou -1).
 */
async function atualizarQuantidade(produtoId, delta) {
    try {
        const modal = document.getElementById('cart-modal');
        // Encontra o elemento do item dentro do modal para obter a quantidade atual exibida.
        // É importante buscar pelo `qty-decr` ou `qty-incr` para garantir que estamos no contexto do item correto.
        const itemQtyContainer = modal.querySelector(`.qty-incr[data-id="${produtoId}"]`)?.parentElement;
        if (!itemQtyContainer) {
            console.warn(`Elemento de quantidade para o produto ${produtoId} não encontrado no modal.`);
            return;
        }

        const qtySpan = itemQtyContainer.querySelector('.qty-value');
        const currentQty = parseInt(qtySpan.textContent, 10); // Pega a quantidade atual do DOM
        const newQty = currentQty + delta; // Calcula a nova quantidade

        // Se a nova quantidade for zero ou menos, o item deve ser removido do carrinho.
        if (newQty <= 0) {
            return await removerDoCarrinho(produtoId);
        }

        // Prepara os dados para enviar a nova quantidade ao backend.
        const formData = new FormData();
        formData.append('quantidade', newQty);
        // Envia a requisição POST para atualizar a quantidade do item.
        const resp = await fetch(`/carrinho/atualizar/${produtoId}`, { method: 'POST', body: formData, credentials: 'same-origin' });

        // Alteração Gemini: Trata erro de autenticação
        if (handleAuthError(resp)) {
            return;
        }

        // Lança um erro se a requisição não for bem-sucedida.
        if (!resp.ok) throw new Error('Falha ao atualizar quantidade.');

        // Atualiza o contador de itens e reabre o modal para mostrar a quantidade atualizada.
        await atualizarContadorCarrinho();
        await mostrarCarrinho();

    } catch (e) {
        console.error('Erro atualizarQuantidade:', e);
        // Feedback de erro para o usuário.
    }
}

// ---------- Inicialização e Handlers de Eventos ----------

/**
 * Configura os event listeners para as interações globais relacionadas ao carrinho,
 * como cliques nos botões "Adicionar ao Carrinho" e no ícone do carrinho no cabeçalho.
 * Usa delegação de eventos para eficiência.
 */
function setupCartHandlers() {
    // Handler para botões "Adicionar ao Carrinho" em toda a página.
    // Ouve cliques em todo o documento e verifica se o clique ocorreu em um botão
    // com a classe `.add-to-cart-btn` ou `.add-to-cart`.
    document.addEventListener('click', (e) => {
        const addButton = e.target.closest('.add-to-cart-btn, .add-to-cart');
        if (addButton) {
            e.preventDefault(); // Previne o comportamento padrão (ex: submissão de formulário ou navegação).
            const productId = addButton.dataset.productId || addButton.dataset.id; // Pega o ID do produto
            if (productId) {
                adicionarAoCarrinho(productId); // Chama a função para adicionar ao carrinho.
            }
        }
    }, false);

    // Handler para o ícone do carrinho no cabeçalho.
    // Quando clicado, abre o modal do carrinho.
    document.addEventListener('click', (e) => {
        const cartIcon = e.target.closest('#cart-button, .cart-button');
        if (cartIcon) {
            e.preventDefault(); // Previne o comportamento padrão (ex: navegação).
            mostrarCarrinho(); // Abre o modal do carrinho.
        }
    }, false);
}

/**
 * Bloco de inicialização que executa funções quando o DOM está completamente carregado.
 * Garante que todos os elementos HTML necessários estejam disponíveis antes de anexar listeners ou atualizar a UI.
 */
document.addEventListener('DOMContentLoaded', () => {
    setupCartHandlers(); // Configura os handlers de eventos do carrinho.
    atualizarContadorCarrinho(); // Atualiza o contador de itens do carrinho no cabeçalho ao carregar a página.
});

/**
 * Segundo bloco de inicialização, focado na funcionalidade de busca do modal.
 * Este código intercepta o envio do formulário de busca e redireciona o usuário para
 * a página de catálogo com o termo pesquisado como um parâmetro na URL.
 * (ex: /catalogo?q=camisa).
 */
document.addEventListener('DOMContentLoaded', () => {
    const searchModalForm = document.querySelector('.search-modal-form');
    const searchModalInput = document.querySelector('.search-modal-input');

    if (searchModalForm && searchModalInput) {
        searchModalForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Impede o envio padrão do formulário, que causaria um refresh.
            const searchTerm = searchModalInput.value.trim(); // Obtém o termo de busca.
            if (searchTerm) {
                // Redireciona para a página de catálogo com o termo de busca codificado na URL.
                window.location.href = `/catalogo?q=${encodeURIComponent(searchTerm)}`;
            }
        });
    }
});

// Exports: Torna as funções importantes acessíveis globalmente ou para outros módulos, se necessário.
// Isso permite que outras partes da aplicação (ou até o console do navegador) possam chamar essas funções.
window.mostrarCarrinho = mostrarCarrinho;
window.updateCartCount = atualizarContadorCarrinho; // Renomeado para consistência com o padrão em português.
// As funções abaixo não foram definidas neste script ou não são usadas no contexto atual.
// window.getCart = _getCartFromStorage;
// window.setCart = _setCartToStorage;
// window.clearCart = _clearCartStorage;
window.adicionarAoCarrinho = adicionarAoCarrinho;
// window.syncLocalCartToBackend = syncLocalCartToBackend;
