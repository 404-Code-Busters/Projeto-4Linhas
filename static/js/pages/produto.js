document.addEventListener('DOMContentLoaded', function () {
  const mainImage = document.getElementById('main-product-image');
  const thumbnails = document.querySelectorAll('.thumbnail');

  if (!mainImage || thumbnails.length === 0) {
    return; // Sai se os elementos não existirem
  }

  thumbnails.forEach(thumbnail => {
    thumbnail.addEventListener('click', function () {
      // Obtém o caminho da imagem em tamanho real do atributo data
      const fullImageSrc = this.dataset.fullImage;

      // Atualiza a imagem principal
      mainImage.src = fullImageSrc;

      // Remove a classe 'active' de todas as miniaturas
      thumbnails.forEach(t => t.classList.remove('active'));

      // Adiciona a classe 'active' à miniatura clicada
      this.classList.add('active');
    });
  });

  // ===== DETECÇÃO DE TIPO DE PRODUTO E PREENCHIMENTO DE TAMANHOS =====
  const productOptions = document.querySelector('.product-options');
  const tamanhoSelect = document.getElementById('tamanho-select');
  
  if (productOptions && tamanhoSelect) {
    // Obtém o tamanho diretamente do banco de dados (vem no data-tamanho)
    const tamanhoFromDB = productOptions.dataset.tamanho || '';
    
    let sizes = [];
    
    if (tamanhoFromDB) {
      // Se houver tamanho no banco, divide por vírgula ou espaço
      // Exemplo: "34,35,36" ou "P,M,G" ou "34 35 36"
      sizes = tamanhoFromDB
        .split(/[,\s]+/)  // Divide por vírgula ou espaço
        .map(s => s.trim()) // Remove espaços em branco
        .filter(s => s.length > 0); // Remove entradas vazias
      
      // Remove duplicatas
      sizes = [...new Set(sizes)];
      
      // Ordena tamanhos numéricos ou alfabéticos apropriadamente
      if (sizes.every(s => /^\d+$/.test(s))) {
        // Se são números, ordena numericamente
        sizes.sort((a, b) => parseInt(a) - parseInt(b));
      } else {
        // Se são letras, mantém a ordem ou ordena alfabeticamente
        sizes.sort();
      }
    } else {
      // Fallback: se não houver tamanho no banco, detecta pelo nome do produto
      const productName = productOptions.dataset.productName || '';
      
      // Palavras-chave para detectar tipo de produto
      const calçadoKeywords = ['tenis', 'tênis', 'sapato', 'bota', 'sandalia', 'sandália', 'chinelo'];
      const roupaKeywords = ['camiseta', 'camisa', 'calça', 'calca', 'bermuda', 'short', 'blusa', 'jaqueta', 'vestido', 'saia', 'moletom', 'meia', 'meias'];
      
      // Detecta se é calçado
      const isCalçado = calçadoKeywords.some(keyword => productName.includes(keyword));
      
      if (isCalçado) {
        // Tamanhos numéricos para calçados (tênis, sapatos, etc)
        sizes = ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
      } else {
        // Tamanhos em letras para roupas
        sizes = ['XP', 'P', 'M', 'G', 'GG', 'XG'];
      }
    }
    
    // Preenche o select com os tamanhos
    tamanhoSelect.innerHTML = '<option value="">Selecione um tamanho</option>';
    sizes.forEach(size => {
      const option = document.createElement('option');
      option.value = size;
      option.textContent = size;
      tamanhoSelect.appendChild(option);
    });
  }
});