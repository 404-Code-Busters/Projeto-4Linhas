/* Hybrid cart: usa backend quando autenticado e localStorage como fallback/híbrido.
   - Mantém compatibilidade com chamadas existentes: mostrarCarrinho, adicionarAoCarrinho, updateCartCount
   - Se backend responde 401 nas operações de adicionar, grava localmente e mostra modal.
   - Expondo syncLocalCartToBackend() para sincronizar após login (pode ser chamada pelo fluxo de login).
*/

// ---------- localStorage helpers (do backup antigo) ----------
function _getCartFromStorage() {
    try {
        const raw = localStorage.getItem('cart');
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.warn('Erro ao ler carrinho do localStorage:', e);
        return [];
    }
}

function _setCartToStorage(cart) {
    try {
        localStorage.setItem('cart', JSON.stringify(Array.isArray(cart) ? cart : []));
    } catch (e) {
        console.warn('Erro ao salvar carrinho no localStorage:', e);
    }
}

function _clearCartStorage() {
    try {
        localStorage.removeItem('cart');
    } catch (e) {
        console.warn('Erro ao limpar carrinho do localStorage:', e);
    }
}

// ---------- UI: modal rendering (adaptado do backup) ----------
function mostrarCarrinho() {
    // Tenta detectar se o usuário está autenticado consultando o contador.
    // Se não autenticado, mostra o modal localStorage. Se autenticado, preferimos redirecionar para /perfil
    // (o backend mantém o estado autoritativo). Se quiser, podemos ainda tentar renderizar via API.
    const localCart = _getCartFromStorage();
    if (localCart && localCart.length > 0) {
        // há itens locais — mostramos o modal híbrido
        return openCartModalFromLocal();
    }

    // sem items locais: checar contador para saber se existe carrinho no backend
    fetch('/carrinho/contador', { credentials: 'same-origin' }).then(r => {
        if (r.status === 401) {
            // não autenticado — modal vazio
            openCartModalFromLocal();
            return;
        }
        if (!r.ok) {
            openCartModalFromLocal();
            return;
        }
        // se backend tem contador, redirecionamos para a página do carrinho/perfil para finalizar
        r.json().then(data => {
            if (data && data.quantidade > 0) {
                // mostramos opção de ir para o carrinho do usuário
                const modal = buildEmptyModal('Você tem itens no seu carrinho no servidor. Deseja ver a página do carrinho?');
                modal.querySelector('.cart-checkout').addEventListener('click', () => window.location.href = '/perfil');
                showModal(modal);
            } else {
                openCartModalFromLocal();
            }
        }).catch(() => openCartModalFromLocal());
    }).catch(() => openCartModalFromLocal());
}

function buildEmptyModal(message) {
    const modal = document.createElement('div');
    modal.id = 'cart-modal';
    modal.className = 'cart-modal open';
    modal.innerHTML = `
        <div class="cart-modal-backdrop"></div>
        <div class="cart-modal-panel">
            <div class="cart-modal-header">
                <h2 class="cart-modal-title">Seu Carrinho</h2>
                <button class="cart-modal-close" aria-label="Fechar">&times;</button>
            </div>
            <div class="cart-items"><p>${message}</p></div>
            <div class="cart-total" style="margin-top: 1rem; font-weight: 700; text-align: right;"></div>
            <div class="cart-actions">
                <button class="cart-checkout">Ver carrinho</button>
            </div>
        </div>`;
    modal.querySelector('.cart-modal-close').addEventListener('click', () => closeCartModal());
    modal.querySelector('.cart-modal-backdrop').addEventListener('click', () => closeCartModal());
    return modal;
}

function openCartModalFromLocal() {
    const cart = _getCartFromStorage();
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
                    <button class="cart-checkout">Finalizar compra</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.cart-modal-close').addEventListener('click', () => closeCartModal());
        modal.querySelector('.cart-modal-backdrop').addEventListener('click', () => closeCartModal());
    }

    const container = modal.querySelector('.cart-items');
    const totalContainer = modal.querySelector('.cart-total');
    container.innerHTML = '';
    totalContainer.innerHTML = '';

    if (!cart || cart.length === 0) {
        container.innerHTML = '<p>Seu carrinho está vazio.</p>';
    } else {
        let total = 0;
        cart.forEach((item, idx) => {
            const row = document.createElement('div');
            row.className = 'cart-item-row';
            const itemTotal = (Number(item.preco) || 0) * (Number(item.quantidade) || 1);
            total += itemTotal;
            row.innerHTML = `
                <img src="${item.imagem || ''}" alt="${item.nome || ''}" class="cart-item-img">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.nome || ''}</div>
                    <div class="cart-item-price">R$ ${itemTotal.toFixed(2)}</div>
                    <div class="cart-item-qty">Qtd: <button class="qty-decr" data-idx="${idx}">-</button> <span class="qty-value">${Number(item.quantidade || 1)}</span> <button class="qty-incr" data-idx="${idx}">+</button></div>
                </div>
                <button class="cart-item-remove" data-idx="${idx}">Remover</button>
            `;
            container.appendChild(row);
        });

        totalContainer.textContent = `Total: R$ ${total.toFixed(2)}`;

        // attach remove handlers
        container.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = Number(e.currentTarget.dataset.idx);
                removeItemAtIndex(idx);
            });
        });

        // attach qty +/- handlers
        container.querySelectorAll('.qty-incr').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = Number(e.currentTarget.dataset.idx);
                changeQuantityAtIndex(idx, 1);
            });
        });
        container.querySelectorAll('.qty-decr').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = Number(e.currentTarget.dataset.idx);
                changeQuantityAtIndex(idx, -1);
            });
        });
    }

    // checkout handler: if logged -> go to /perfil (server checkout), else force registration
    modal.querySelector('.cart-checkout').onclick = async () => {
        try {
            const resp = await fetch('/carrinho/contador', { credentials: 'same-origin' });
            if (resp.status === 401) {
                // obrigar registro
                window.location.href = '/cadastre-se';
                return;
            }
            // se autenticado, encaminhar para perfil/carrinho do servidor
            window.location.href = '/perfil';
        } catch (e) {
            // fallback: exigir registro
            window.location.href = '/cadastre-se';
        }
    };

    showModal(modal);
}

function showModal(modal) {
    // remove modal antigo se existir
    const old = document.getElementById('cart-modal');
    if (old && old !== modal) old.remove();
    if (!document.getElementById('cart-modal')) document.body.appendChild(modal);
    modal.classList.add('open');
}

function closeCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) modal.classList.remove('open');
}

// ---------- local UI helpers for local modal ----------
function removeItemAtIndex(idx) {
    try {
        const cart = _getCartFromStorage();
        if (idx >= 0 && idx < cart.length) {
            cart.splice(idx, 1);
            _setCartToStorage(cart);
            updateCartCount();
            mostrarCarrinho();
        }
    } catch (e) {
        console.error('Erro ao remover item do carrinho:', e);
    }
}

function changeQuantityAtIndex(idx, delta) {
    try {
        const cart = _getCartFromStorage();
        if (idx >= 0 && idx < cart.length) {
            const item = cart[idx];
            const newQty = (Number(item.quantidade) || 1) + Number(delta);
            if (newQty <= 0) {
                cart.splice(idx, 1);
            } else {
                item.quantidade = newQty;
            }
            _setCartToStorage(cart);
            updateCartCount();
            mostrarCarrinho();
        }
    } catch (e) {
        console.error('Erro ao alterar quantidade do item:', e);
    }
}

// ---------- backend-integrated functions (add/remove/update/contador) ----------
async function atualizarContadorCarrinho() {
    try {
        const response = await fetch('/carrinho/contador', { credentials: 'same-origin' });
        if (!response.ok) return updateCartCount();
        const data = await response.json();
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = data.quantidade;
        }
    } catch (error) {
        // se erro, usa contador local
        updateCartCount();
    }
}

// tenta adicionar ao backend; se receber 401 ou falha, adiciona ao localStorage
async function adicionarAoCarrinho(itemOrId) {
    try {
        // aceita um id simples ou um objeto item
        let produtoId = null;
        let itemObj = null;
        if (itemOrId && typeof itemOrId === 'object' && (itemOrId.nome || itemOrId.id)) {
            itemObj = itemOrId;
            produtoId = itemObj.id || itemObj.id_produto || itemObj.productId || itemObj.nome;
        } else {
            produtoId = itemOrId;
        }

        // se temos apenas id, tentamos adicionar via backend pela rota que já existe
        if (produtoId && (!itemObj || Object.keys(itemObj).length === 1)) {
            // protege contra requisições duplicadas
            window._pendingCartAdds = window._pendingCartAdds || new Set();
            if (window._pendingCartAdds.has(String(produtoId))) return false;
            window._pendingCartAdds.add(String(produtoId));
            try {
                const response = await fetch(`/carrinho/adicionar/${produtoId}`, { method: 'POST', headers: { 'Accept': 'application/json' }, credentials: 'same-origin' });
                if (response.status === 401) {
                    // salva localmente
                    _addToLocalById(produtoId);
                    return false;
                }
                const ct = response.headers.get('content-type') || '';
                if (!response.ok || !ct.includes('application/json')) {
                    // fallback local
                    _addToLocalById(produtoId);
                    return false;
                }
                const data = await response.json();
                if (data && data.success) {
                    await atualizarContadorCarrinho();
                    return true;
                } else {
                    _addToLocalById(produtoId);
                    return false;
                }
            } finally {
                window._pendingCartAdds.delete(String(produtoId));
            }
        }

        // se recebemos um objeto com detalhes do produto, preferimos tentar backend e, se falhar, salvar localmente
        if (itemObj) {
            // tenta backend se tiver id
            if (itemObj.id) {
                try {
                    const resp = await fetch(`/carrinho/adicionar/${itemObj.id}`, { method: 'POST', headers: { 'Accept': 'application/json' }, credentials: 'same-origin' });
                    if (resp.ok) {
                        const data = await resp.json();
                        if (data && data.success) {
                            await atualizarContadorCarrinho();
                            return true;
                        }
                    }
                } catch (e) {
                    // ignore and fallback to local
                }
            }
            // fallback: adicionar no localStorage
            _addToLocalItem(itemObj);
            return false;
        }

        return false;
    } catch (e) {
        console.error('Erro adicionarAoCarrinho:', e);
        return false;
    }
}

function _addToLocalById(produtoId) {
    // cria um item genérico com id como nome se não tivermos dados
    const existing = _getCartFromStorage();
    const found = existing.find(i => (i.id || i.nome) === String(produtoId));
    if (found) {
        found.quantidade = (Number(found.quantidade) || 1) + 1;
    } else {
        existing.push({ id: String(produtoId), nome: `Produto ${produtoId}`, preco: 0, quantidade: 1, imagem: '' });
    }
    _setCartToStorage(existing);
    updateCartCount();
}

function _addToLocalItem(item) {
    try {
        const cart = _getCartFromStorage();
        const id = item.id || item.nome;
        const existing = cart.find(c => (c.id || c.nome) === id || c.nome === item.nome);
        if (existing) {
            existing.quantidade = (Number(existing.quantidade) || 1) + (Number(item.quantidade) || 1);
            if (item.imagem) existing.imagem = item.imagem;
            if (item.preco) existing.preco = item.preco;
        } else {
            cart.push({ id: id, nome: item.nome || `Produto ${id}`, preco: item.preco || 0, quantidade: Number(item.quantidade) || 1, imagem: item.imagem || '' });
        }
        _setCartToStorage(cart);
        updateCartCount();
    } catch (e) {
        console.error('Erro ao adicionar no local:', e);
    }
}

// expõe função para sincronizar itens locais com o backend após login
async function syncLocalCartToBackend() {
    const cart = _getCartFromStorage();
    if (!cart || cart.length === 0) return;
    for (const item of cart) {
        try {
            // tenta adicionar pelo id, se existir
            if (item.id) {
                await fetch(`/carrinho/adicionar/${item.id}`, { method: 'POST', headers: { 'Accept': 'application/json' }, credentials: 'same-origin' });
            } else {
                // sem id, tentamos enviar por nome (server pode ignorar)
                await fetch(`/carrinho/adicionar/${encodeURIComponent(item.nome)}`, { method: 'POST', headers: { 'Accept': 'application/json' }, credentials: 'same-origin' });
            }
        } catch (e) {
            // ignore falhas individuais
        }
    }
    // limpar local e atualizar contador
    _clearCartStorage();
    await atualizarContadorCarrinho();
}

// Remove do backend ou do local dependendo do contexto
async function removerDoCarrinho(produtoId) {
    try {
        const resp = await fetch(`/carrinho/remover/${produtoId}`, { method: 'POST', credentials: 'same-origin' });
        if (resp.status === 401) {
            // remover do local
            const cart = _getCartFromStorage();
            const idx = cart.findIndex(i => (i.id || i.nome) === String(produtoId));
            if (idx >= 0) {
                cart.splice(idx, 1);
                _setCartToStorage(cart);
                updateCartCount();
                mostrarCarrinho();
            }
            return;
        }
        if (!resp.ok) throw new Error('Erro ao remover');
        await atualizarContadorCarrinho();
        window.location.reload();
    } catch (e) {
        console.error('Erro removerDoCarrinho:', e);
    }
}

// atualizar quantidade via backend quando possível
async function atualizarQuantidade(produtoId, quantidade) {
    try {
        const formData = new FormData();
        formData.append('quantidade', quantidade);
        const resp = await fetch(`/carrinho/atualizar/${produtoId}`, { method: 'POST', body: formData, credentials: 'same-origin' });
        if (resp.status === 401) {
            // atualizar local
            const cart = _getCartFromStorage();
            const idx = cart.findIndex(i => (i.id || i.nome) === String(produtoId));
            if (idx >= 0) {
                cart[idx].quantidade = quantidade;
                _setCartToStorage(cart);
                updateCartCount();
            }
            mostrarCarrinho();
            return;
        }
        if (!resp.ok) throw new Error('Erro');
        await atualizarContadorCarrinho();
        window.location.reload();
    } catch (e) {
        console.error('Erro atualizarQuantidade:', e);
    }
}

// updateCartCount: soma local + backend quando possível
function updateCartCount() {
    // soma quantidades locais
    const local = _getCartFromStorage();
    const localCount = local.reduce((acc, it) => acc + (Number(it.quantidade) || 1), 0);
    const el = document.getElementById('cart-count');
    if (!el) return;
    el.textContent = String(localCount);
    try {
        if (localCount <= 0) {
            el.style.display = 'none';
        } else {
            el.style.display = 'inline-flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.minWidth = '18px';
            el.style.padding = '0 6px';
            el.style.height = '18px';
            el.style.borderRadius = '999px';
            el.style.backgroundColor = '#FF6B35';
            el.style.color = '#fff';
            el.style.fontSize = '11px';
            el.style.fontWeight = '600';
            el.style.border = '2px solid #fff';
        }
    } catch (e) {}
}

// Setup bindings (attach to add-to-cart buttons and cart icon)
function setupCartHandlers() {
    // remove old event handlers by cloning nodes (defensive)
    document.querySelectorAll('.add-to-cart-btn, .add-to-cart').forEach(btn => {
        const clonedBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(clonedBtn, btn);
    });

    document.querySelectorAll('.add-to-cart-btn, .add-to-cart').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            // tenta extrair dados do botão
            const id = btn.dataset.productId || btn.dataset.id || btn.getAttribute('data-product-id');
            if (id) {
                await adicionarAoCarrinho(id);
            } else {
                // tolerante: tenta criar um objeto a partir do card
                const card = btn.closest('.product-card, .product-main, .outfit-card') || document;
                const nameEl = card.querySelector('.product-title, h3, .product-card-title');
                const productName = nameEl ? nameEl.textContent.trim() : 'Produto';
                const priceEl = card.querySelector('.product-price') || card.querySelector('.related-price') || null;
                let priceNumber = 0;
                if (priceEl) priceNumber = parseFloat(String(priceEl.textContent).replace(/[^0-9,\.]/g, '').replace(',', '.')) || 0;
                const imgEl = card.querySelector('img') || document.querySelector('img.product-image-main');
                const imgSrc = imgEl ? imgEl.getAttribute('src') : '';
                await adicionarAoCarrinho({ nome: productName, preco: priceNumber, quantidade: 1, imagem: imgSrc });
            }
            updateCartCount();
        });
    });

    // cart icon handlers
    document.addEventListener('click', (e) => {
        try {
            const trigger = e.target.closest && e.target.closest('#cart-button, .cart-button, a.cart-link, a[data-cart]');
            if (!trigger) return;
            if (trigger.tagName && trigger.tagName.toLowerCase() === 'a') e.preventDefault();
            mostrarCarrinho();
        } catch (err) {}
    }, false);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    setupCartHandlers();
    // inicializa contador local
    updateCartCount();
    // se o usuário estiver autenticado e tiver itens locais, tentamos sincronizar automaticamente
    (async () => {
        const cart = _getCartFromStorage();
        if (!cart || cart.length === 0) return;
        try {
            const resp = await fetch('/carrinho/contador', { credentials: 'same-origin' });
            if (resp.ok) {
                // temos sessão ativa, sincroniza
                await syncLocalCartToBackend();
            }
        } catch (e) {}
    })();
});

// Exports
window.mostrarCarrinho = mostrarCarrinho;
window.updateCartCount = updateCartCount;
window.getCart = _getCartFromStorage;
window.setCart = _setCartToStorage;
window.clearCart = _clearCartStorage;
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.syncLocalCartToBackend = syncLocalCartToBackend;
