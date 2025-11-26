/*
  Carrinho 100% baseado no backend.
  - Ao clicar no ícone, busca os itens do servidor via /carrinho/itens.
  - Se o usuário não estiver logado (401), exibe uma mensagem para fazer login.
  - Adicionar, remover e atualizar quantidade são feitos via API e o modal é atualizado dinamicamente.
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
                    <a href="/perfil" class="cart-checkout">Finalizar compra</a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
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

    container.innerHTML = ''; // Limpa o conteúdo anterior

    if (!data || !data.itens || data.itens.length === 0) {
        container.innerHTML = '<p>Seu carrinho está vazio.</p>';
        totalContainer.innerHTML = '';
        checkoutButton.style.display = 'none'; // Esconde o botão de finalizar
    } else {
        data.itens.forEach(item => {
            const row = document.createElement('div');
            row.className = 'cart-item-row';
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

        totalContainer.textContent = `Total: R$ ${Number(data.total || 0).toFixed(2).replace('.', ',')}`;
        checkoutButton.style.display = 'block'; // Mostra o botão de finalizar

        // Adiciona os handlers para os botões de quantidade e remoção
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

    container.innerHTML = `<p>${message}</p>`;
    totalContainer.innerHTML = '';
    checkoutButton.style.display = 'none';

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
    modal.classList.add('open');
    renderCartMessage('Carregando...'); // Mostra feedback enquanto carrega

    try {
        const response = await fetch('/carrinho/itens', { credentials: 'same-origin' });

        if (response.status === 401) {
            renderCartMessage('Faça login para ver seu carrinho.', true);
            return;
        }

        if (!response.ok) {
            throw new Error('Falha ao buscar o carrinho.');
        }

        const data = await response.json();
        renderCartModal(data);

    } catch (error) {
        console.error('Erro ao buscar carrinho:', error);
        renderCartMessage('Ocorreu um erro ao carregar seu carrinho.');
    }
}

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
        const cartCountEl = document.getElementById('cart-count');
        if (!cartCountEl) return;

        if (!response.ok) {
            cartCountEl.textContent = '0';
            cartCountEl.style.display = 'none';
            return;
        }

        const data = await response.json();
        const count = data.quantidade || 0;
        cartCountEl.textContent = count;
        cartCountEl.style.display = count > 0 ? 'inline-flex' : 'none';

    } catch (error) {
        console.error('Erro ao atualizar contador:', error);
    }
}

/**
 * Adiciona um item ao carrinho no backend.
 * @param {string|number} produtoId - O ID do produto a ser adicionado.
 */
async function adicionarAoCarrinho(itemOrId) {
    try {
        const produtoId = (typeof itemOrId === 'object') ? itemOrId.id : itemOrId;
        if (!produtoId) return;

        const response = await fetch(`/carrinho/adicionar/${produtoId}`, { method: 'POST', credentials: 'same-origin' });
        if (response.status === 401) {
            window.location.href = '/login'; // Redireciona para login se não autenticado
            return;
        }
        if (!response.ok) throw new Error('Falha ao adicionar item.');

        await atualizarContadorCarrinho();
        // Alteração feita: Abrir o modal após adicionar um item.
        await mostrarCarrinho(); // Isso fornece feedback visual imediato ao usuário.

    } catch (e) {
        console.error('Erro adicionarAoCarrinho:', e);
    }
}

/**
 * Remove um item do carrinho no backend e atualiza o modal.
 * @param {string|number} produtoId - O ID do produto a ser removido.
 */
async function removerDoCarrinho(produtoId) {
    try {
        const resp = await fetch(`/carrinho/remover/${produtoId}`, { method: 'POST', credentials: 'same-origin' });
        if (!resp.ok) throw new Error('Falha ao remover item.');

        await atualizarContadorCarrinho();
        await mostrarCarrinho(); // Re-renderiza o modal

    } catch (e) {
        console.error('Erro removerDoCarrinho:', e);
    }
}

/**
 * Altera a quantidade de um item no carrinho.
 * @param {string|number} produtoId - O ID do produto.
 * @param {number} delta - A mudança na quantidade (+1 ou -1).
 */
async function atualizarQuantidade(produtoId, delta) {
    try {
        // Primeiro, busca o item para saber a quantidade atual
        const modal = document.getElementById('cart-modal');
        const itemRow = modal.querySelector(`.qty-decr[data-id="${produtoId}"]`);
        if (!itemRow) return;

        const qtySpan = itemRow.parentElement.querySelector('.qty-value');
        const currentQty = parseInt(qtySpan.textContent, 10);
        const newQty = currentQty + delta;

        if (newQty <= 0) {
            // Se a quantidade for zero ou menos, remove o item
            return await removerDoCarrinho(produtoId);
        }

        const formData = new FormData();
        formData.append('quantidade', newQty);
        const resp = await fetch(`/carrinho/atualizar/${produtoId}`, { method: 'POST', body: formData, credentials: 'same-origin' });

        if (!resp.ok) throw new Error('Falha ao atualizar quantidade.');

        await atualizarContadorCarrinho();
        await mostrarCarrinho(); // Re-renderiza o modal

    } catch (e) {
        console.error('Erro atualizarQuantidade:', e);
    }
}

// ---------- Inicialização e Handlers de Eventos ----------

function setupCartHandlers() {
    // Handler para botões "Adicionar ao Carrinho"
    document.addEventListener('click', (e) => {
        const addButton = e.target.closest('.add-to-cart-btn, .add-to-cart');
        if (addButton) {
            e.preventDefault();
            const productId = addButton.dataset.productId || addButton.dataset.id;
            if (productId) {
                adicionarAoCarrinho(productId);
            }
        }
    }, false);

    // Handler para o ícone do carrinho no header
    document.addEventListener('click', (e) => {
        const cartIcon = e.target.closest('#cart-button, .cart-button');
        if (cartIcon) {
            e.preventDefault();
            mostrarCarrinho();
        }
    }, false);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    setupCartHandlers();
    atualizarContadorCarrinho(); // Atualiza o contador ao carregar a página
});

// Alteração feita pelo Gemini: Lógica para fazer a busca da modal funcionar.
// Este código intercepta o envio do formulário de busca e redireciona para a página de catálogo
// com o termo pesquisado como um parâmetro na URL (ex: /catalogo?q=camisa).
document.addEventListener('DOMContentLoaded', () => {
    const searchModalForm = document.querySelector('.search-modal-form');
    const searchModalInput = document.querySelector('.search-modal-input');

    if (searchModalForm && searchModalInput) {
        searchModalForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Impede o envio padrão do formulário
            const searchTerm = searchModalInput.value.trim();
            if (searchTerm) {
                window.location.href = `/catalogo?q=${encodeURIComponent(searchTerm)}`;
            }
        });
    }
});

// Exports
window.mostrarCarrinho = mostrarCarrinho;
window.updateCartCount = updateCartCount;
window.getCart = _getCartFromStorage;
window.setCart = _setCartToStorage;
window.clearCart = _clearCartStorage;
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.syncLocalCartToBackend = syncLocalCartToBackend;
