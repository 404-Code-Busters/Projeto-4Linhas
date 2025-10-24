// Funções do carrinho integradas com o backend Python

// Mostra o carrinho redirecionando para a página de perfil
async function mostrarCarrinho() {
    try {
        const response = await fetch('/carrinho');
        if (!response.ok) {
            if (response.status === 303) {
                window.location.href = '/login';
                return;
            }
            throw new Error('Erro ao buscar carrinho');
        }
        
        // Atualiza o contador do carrinho
        await atualizarContadorCarrinho();
        
        // Redireciona para a página de perfil na aba do carrinho
        window.location.href = '/perfil';
    } catch (error) {
        console.error('Erro:', error);
    }
}

// Atualiza o contador de itens no carrinho
async function atualizarContadorCarrinho() {
    try {
        console.log('Atualizando contador do carrinho');
        const response = await fetch('/carrinho/contador');
        const data = await response.json();
        console.log('Contador atualizado:', data);
        
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = data.quantidade;
        } else {
            console.error('Elemento cart-count não encontrado');
        }
    } catch (error) {
        console.error('Erro ao atualizar contador:', error);
    }
}

// Adiciona um item ao carrinho
async function adicionarAoCarrinho(produtoId) {
    try {
        console.log('Adicionando produto ao carrinho:', produtoId);
        
        const formData = new FormData();
        const response = await fetch(`/carrinho/adicionar/${produtoId}`, {
            method: 'POST'
        });

        const data = await response.json();
        console.log('Resposta do servidor:', data);

        if (!response.ok) {
            throw new Error('Erro ao adicionar ao carrinho');
        }

        // Atualiza o contador
        await atualizarContadorCarrinho();
        alert('Produto adicionado ao carrinho com sucesso!');
        
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao adicionar ao carrinho: ' + error.message);
    }
}

// Remove um item do carrinho
async function removerDoCarrinho(produtoId) {
    try {
        console.log('Removendo produto do carrinho:', produtoId);
        
        const formData = new FormData();
        const response = await fetch(`/carrinho/remover/${produtoId}`, {
            method: 'POST'  // Mudado de DELETE para POST para corresponder ao backend
        });

        const data = await response.json();
        console.log('Resposta do servidor:', data);

        if (!response.ok) {
            throw new Error('Erro ao remover do carrinho');
        }

        // Atualiza o contador e recarrega a página
        await atualizarContadorCarrinho();
        window.location.reload();
        
    } catch (error) {
        console.error('Erro:', error);
    }
}

// Atualiza a quantidade de um item
async function atualizarQuantidade(produtoId, quantidade) {
    try {
        console.log('Atualizando quantidade:', produtoId, quantidade);
        
        const formData = new FormData();
        formData.append('quantidade', quantidade);
        
        const response = await fetch(`/carrinho/atualizar/${produtoId}`, {
            method: 'POST',  // Mudado de PUT para POST para corresponder ao backend
            body: formData
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar quantidade');
        }

        // Atualiza o contador e recarrega a página
        await atualizarContadorCarrinho();
        window.location.reload();
        
    } catch (error) {
        console.error('Erro:', error);
    }
}

// Configura os manipuladores de eventos do carrinho
function setupCartHandlers() {
    // Botões de adicionar ao carrinho
    // suporta variantes de seletor comuns em diferentes páginas
    document.querySelectorAll('.add-to-cart-btn, .add-to-cart').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const produtoId = btn.dataset.productId || btn.dataset.id || btn.getAttribute('data-product-id');
            // incremento otimista do contador no header (melhora UX)
            incrementarContadorLocal(1);
            await adicionarAoCarrinho(produtoId);
        });
    });

    // Botões de remover do carrinho
    document.querySelectorAll('.remove-from-cart-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const produtoId = btn.dataset.productId;
            await removerDoCarrinho(produtoId);
        });
    });

    // Inputs de quantidade
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const produtoId = input.dataset.productId;
            const quantidade = parseInt(input.value);
            if (quantidade > 0) {
                await atualizarQuantidade(produtoId, quantidade);
            }
        });
    });
}

// Quando a página carrega, configura os handlers e atualiza o contador
document.addEventListener('DOMContentLoaded', () => {
    setupCartHandlers();
    atualizarContadorCarrinho();
});

// ===== helpers de UI do contador =====
function getCounterElements() {
    const sels = ['.carrinho-contador', '#cart-count', '.cart-count', '.cart-counter'];
    const elems = [];
    sels.forEach(s => document.querySelectorAll(s).forEach(el => elems.push(el)));
    return elems;
}

function incrementarContadorLocal(n = 1) {
    try {
        const elems = getCounterElements();
        if (!elems.length) return;
        elems.forEach(el => {
            // se houver um span interno, atualize-o; senão o próprio elemento
            let target = el;
            const inner = el.querySelector && el.querySelector('span');
            if (inner && inner.textContent.trim() !== '') target = inner;

            const cur = parseInt((target.textContent || '').replace(/[^0-9]/g, '')) || 0;
            const novo = cur + Number(n);
            target.textContent = String(novo);
            // exiba o contador se houver
            el.style.display = novo > 0 ? (el.style.display || 'inline-flex') : 'none';
        });
    } catch (e) {
        console.warn('Erro ao incrementar contador local:', e);
    }
}

// expõe função global caso outros scripts queiram usar
window.incrementarContadorLocal = incrementarContadorLocal;
