document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleciona todos os botões de favoritos na página.
    document.querySelectorAll('.favorite-button').forEach(button => {
        
        button.addEventListener('click', async (event) => {
            
            const productId = event.currentTarget.dataset.productId;
            // O estado anterior não é usado para a UI, mas pode ser útil para logs.
            // const isFavorited = event.currentTarget.classList.contains('favorited'); 
            const icon = event.currentTarget.querySelector('img');

            try {
                // 2. Envia a requisição POST para alternar o estado de favorito.
                const response = await fetch('/api/favoritos/toggle', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ product_id: productId })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                // 3. Atualiza a UI com base na resposta do servidor.
                if (data.status === 'added') {
                    // Estado final: FAVORITADO (Coração preenchido)
                    event.currentTarget.classList.add('favorited');
                    icon.src = '/static/assets/icons/add-to-favorites.png'; // Caminho para o coração preenchido
                    icon.alt = 'Remover dos favoritos';
                    
                } else if (data.status === 'removed') {
                    // Estado final: REMOVIDO (Coração vazio)
                    event.currentTarget.classList.remove('favorited');
                    icon.src = '/static/assets/icons/heart.png'; // Caminho para o coração vazio
                    icon.alt = 'Adicionar aos favoritos';
                    
                    // Lógica adicional: Se estiver na página de favoritos, remove o card.
                    if (window.location.pathname === '/favoritos') {
                        const productCard = event.currentTarget.closest('.product-card');
                        if (productCard) {
                            productCard.remove();
                            
                            // Verifica se não sobrou nenhum favorito e mostra a mensagem.
                            if (document.querySelectorAll('.product-card').length === 0) {
                                // Assume que existe um elemento com id 'no-favorites-message'
                                const noFavoritesMessage = document.getElementById('no-favorites-message');
                                if (noFavoritesMessage) {
                                    noFavoritesMessage.style.display = 'block';
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Erro ao alternar favorito:', error);
                // Opcional: Adicionar feedback visual ao usuário em caso de erro.
                // alert('Não foi possível realizar a ação. Tente novamente.');
            }
        });
    });
});