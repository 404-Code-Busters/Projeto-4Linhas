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
});