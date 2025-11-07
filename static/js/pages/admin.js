// Busca de produtos (filtro simples)
function configurarBusca(inputId, tabelaSelector) {
  document.getElementById(inputId)?.addEventListener('input', function(e) {
    const termo = e.target.value.toLowerCase();
    const linhas = document.querySelectorAll(tabelaSelector + ' tbody tr');
    linhas.forEach(linha => {
      const texto = linha.textContent.toLowerCase();
      linha.style.display = texto.includes(termo) ? '' : 'none';
    });
  });
}
configurarBusca('buscaProdutos', '.tabela');

// Confirmações
function confirmarExclusao(id) {
  return confirm('Tem certeza que deseja excluir o produto ' + id + '?');
}
function confirmarDesativacao(id) {
  return confirm('Tem certeza que deseja excluir este usuário?\nEsta ação não pode ser desfeita.');
}

// Modal logic
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');
const editForm = document.getElementById('editProductForm');

function openEditModal(data) {
  // populate fields
  editForm.action = '/admin/produto/atualizar/' + data.id;
  document.getElementById('modal_nome').value = data.nome || '';
  document.getElementById('modal_preco').value = data.preco || '';
  document.getElementById('modal_tamanho').value = data.tamanho || '';
  document.getElementById('modal_estoque').value = data.estoque || '';
  document.getElementById('modal_descricao').value = data.descricao || '';
  document.getElementById('modal_categoria').value = data.categoria || data.cor || '';
  document.getElementById('modal_cor').value = data.cor || '';
  // set image previews (if filenames provided)
  const previews = document.getElementById('modal_image_previews');
  previews.innerHTML = '';
  const imgBase = '/static/uploads/';
  const imgs = [data.imagem, data.imagem1, data.imagem2, data.imagem3];
  imgs.forEach((src, idx) => {
    const item = document.createElement('div');
    item.className = 'preview-item';
    if (src) {
      const img = document.createElement('img');
      img.src = imgBase + src;
      img.alt = 'Imagem do produto';
      item.appendChild(img);
    } else {
      const no = document.createElement('div');
      no.className = 'no-image';
      no.textContent = 'Sem imagem';
      item.appendChild(no);
    }
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '×';
    removeBtn.title = 'Remover imagem';
    removeBtn.addEventListener('click', function() {
      // mark hidden input to signal removal
      const hid = document.getElementById('remove_imagem' + (idx === 0 ? '' : idx));
      if (hid) hid.value = '1';
      // criar e mostrar mensagem de remoção
      const msg = document.createElement('div');
      msg.className = 'remove-message';
      msg.textContent = 'Imagem marcada para remoção';
      msg.style.color = '#ff6b35';
      msg.style.padding = '8px';
      msg.style.textAlign = 'center';
      msg.style.backgroundColor = '#fff3ef';
      msg.style.border = '1px solid #ff6b35';
      msg.style.borderRadius = '4px';
      msg.style.margin = '4px 0';
      item.innerHTML = '';
      item.appendChild(msg);
    });
    item.appendChild(removeBtn);
    previews.appendChild(item);
  });
  // show modal
  modalOverlay.style.display = 'flex';
}

function closeModal() {
  modalOverlay.style.display = 'none';
  editForm.reset();
}

modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', function(e) { if (e.target === modalOverlay) closeModal(); });

// Attach listeners to edit buttons
document.querySelectorAll('.editar-produto-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const dataset = btn.dataset;
    const data = {
      id: dataset.id,
      nome: dataset.nome,
      descricao: dataset.descricao,
      preco: dataset.preco,
      tamanho: dataset.tamanho,
      cor: dataset.cor,
      estoque: dataset.estoque,
      categoria: dataset.categoria
    };
    openEditModal(data);
  });
});

// New-product form: wire image buttons to hidden file inputs and show selected filename
document.querySelectorAll('.image-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    if (input) input.click();
  });
});

const filePairs = [
  {id: 'file_imagem', name: 'imagem'},
  {id: 'file_imagem1', name: 'imagem1'},
  {id: 'file_imagem2', name: 'imagem2'},
  {id: 'file_imagem3', name: 'imagem3'}
];
filePairs.forEach(pair => {
  const inp = document.getElementById(pair.id);
  const label = document.getElementById('fname_' + pair.name);
  const previewContainer = document.getElementById('preview_' + pair.name);
  if (inp) {
    inp.addEventListener('change', function() {
      if (inp.files && inp.files.length) {
        const file = inp.files[0];
        if (label) label.textContent = file.name;
        // create preview
        const reader = new FileReader();
        reader.onload = function(e) {
          if (previewContainer) {
            previewContainer.innerHTML = '';
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = file.name;
            previewContainer.appendChild(img);
          }
        };
        reader.readAsDataURL(file);
      } else {
        if (label) label.textContent = 'Nenhuma';
        if (previewContainer) previewContainer.innerHTML = '<span class="file-name">Nenhuma</span>';
      }
    });
  }
});

// Update tiles count on load
document.addEventListener('DOMContentLoaded', function() {
  const produtosCount = document.querySelectorAll('.tabela tbody tr').length;
  const produtosElement = document.getElementById('produtosCount');
  if (produtosElement) produtosElement.textContent = produtosCount;
});
