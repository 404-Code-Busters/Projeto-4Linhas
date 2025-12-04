// static/js/pages/address_modal.js
// Código compatível com seu HTML (funções globais chamadas pelos onclick do template).

(function () {
  // referências
  const modal = document.getElementById("modal-endereco");
  const listaEl = document.getElementById("enderecos-lista");
  const cepInput = document.getElementById("modal-cep");
  const logradouroInput = document.getElementById("modal-logradouro");
  const bairroInput = document.getElementById("modal-bairro");
  const cidadeInput = document.getElementById("modal-cidade");
  const ufInput = document.getElementById("modal-uf");

  // dados em memória
  let enderecos = [];

  // expõe funções globais (porque seu HTML usa onclick inline)
  window.abrirModalEndereco = function () {
    if (!modal) return console.warn("Modal não encontrado: id='modal-endereco'");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
    
    // limpa campos do modal
    ["modal-cep", "modal-numero"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    
    // limpa campos readonly (CEP lookup)
    ["modal-logradouro", "modal-bairro", "modal-cidade", "modal-uf"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  };

  window.fecharModalEndereco = function () {
    if (!modal) return;
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  };

  // fechar ao clicar fora do conteúdo do modal
  if (modal) {
    modal.addEventListener("click", (e) => {
      // se clicou no backdrop (fora da caixa)
      if (e.target === modal) window.fecharModalEndereco();
    });
  }

  // Busca de CEP ao sair do campo (blur)
  if (cepInput) {
    cepInput.addEventListener("blur", async function () {
      const cep = this.value.replace(/\D/g, "");
      if (cep.length !== 8) return;

      try {
        const response = await fetch(`/api/frete?cep_destino=${cep}`);
        if (!response.ok) throw new Error("Erro ao consultar o CEP");

        const data = await response.json();

        // Preenche os campos automaticamente
        const enderecoParts = data.endereco.split(" - ");
        if (logradouroInput) logradouroInput.value = enderecoParts[0] || "";
        if (bairroInput) bairroInput.value = enderecoParts[1] || "";
        if (cidadeInput) cidadeInput.value = enderecoParts[2] || "";
        if (ufInput) ufInput.value = enderecoParts[3] || "";
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    });
    // Também aceitar Enter para disparar a mesma busca
    cepInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        // remove focus para acionar o evento blur acima
        this.blur();
      }
    });
  }

  // salvar e renderizar
  window.salvarEndereco = function (ev) {
    if (ev && ev.preventDefault) ev.preventDefault();

    const cep = document.getElementById("modal-cep")?.value?.trim() || "";
    const logradouro = logradouroInput?.value?.trim() || "";
    const bairro = bairroInput?.value?.trim() || "";
    const cidade = cidadeInput?.value?.trim() || "";
    const uf = ufInput?.value?.trim() || "";
    const numero = document.getElementById("modal-numero")?.value?.trim() || "";

    if (!cep || !logradouro || !bairro || !cidade || !uf || !numero) {
      if (window.showToast) window.showToast("Preencha todos os campos do novo endereço.", 'error');
      return false;
    }

    enderecos.push({ cep, logradouro, bairro, cidade, uf, numero });
    atualizarListaEnderecos();
    window.fecharModalEndereco();
    return false;
  };

  function atualizarListaEnderecos() {
    if (!listaEl) return console.warn("Elemento de lista não encontrado: id='enderecos-lista'");
    listaEl.innerHTML = "";

    if (enderecos.length === 0) {
      listaEl.innerHTML = `<p style="color:#6b7280; text-align:center; padding:1rem;">Nenhum endereço adicionado ainda.</p>`;
      return;
    }

    enderecos.forEach((e, i) => {
      const item = document.createElement("div");
      item.className = "endereco-item";
      item.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
          <div style="flex-grow:1">
            <strong>${escapeHtml(e.logradouro)}, ${escapeHtml(e.numero)}</strong><br>
            ${escapeHtml(e.bairro)} — ${escapeHtml(e.cidade)} / ${escapeHtml(e.uf)}<br>
            <small style="color:#999">CEP: ${escapeHtml(e.cep)}</small>
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0">
            <button data-idx="${i}" class="addr-edit-btn" type="button">Editar</button>
            <button data-idx="${i}" class="addr-remove-btn" type="button">Excluir</button>
          </div>
        </div>
      `;
      listaEl.appendChild(item);
    });;

    // attach events to edit/remove
    listaEl.querySelectorAll(".addr-remove-btn").forEach(btn => {
      btn.addEventListener("click", (ev) => {
        const idx = Number(ev.currentTarget.getAttribute("data-idx"));
        if (!Number.isNaN(idx)) {
          enderecos.splice(idx, 1);
          atualizarListaEnderecos();
        }
      });
    });

    // editar abre modal populando campos
    listaEl.querySelectorAll(".addr-edit-btn").forEach(btn => {
      btn.addEventListener("click", (ev) => {
        const idx = Number(ev.currentTarget.getAttribute("data-idx"));
        if (!Number.isNaN(idx)) {
          const data = enderecos[idx];
          // preenche modal
          if (cepInput) cepInput.value = data.cep;
          if (logradouroInput) logradouroInput.value = data.logradouro;
          if (bairroInput) bairroInput.value = data.bairro;
          if (cidadeInput) cidadeInput.value = data.cidade;
          if (ufInput) ufInput.value = data.uf;
          document.getElementById("modal-numero").value = data.numero;
          
          // guarda índice temporário para edição
          modal.setAttribute("data-edit-idx", idx);
          modal.style.display = "flex";
          document.body.style.overflow = "hidden";
        }
      });
    });
  }

  // Ao submeter (salvar) quando estamos editando, substituir em vez de push
  const originalSalvar = window.salvarEndereco;
  window.salvarEndereco = function (ev) {
    if (ev && ev.preventDefault) ev.preventDefault();

    const editIdxAttr = modal?.getAttribute("data-edit-idx");
    const isEdit = editIdxAttr !== null;
    const idx = isEdit ? Number(editIdxAttr) : -1;

    const cep = document.getElementById("modal-cep")?.value?.trim() || "";
    const logradouro = logradouroInput?.value?.trim() || "";
    const bairro = bairroInput?.value?.trim() || "";
    const cidade = cidadeInput?.value?.trim() || "";
    const uf = ufInput?.value?.trim() || "";
    const numero = document.getElementById("modal-numero")?.value?.trim() || "";

    if (!cep || !logradouro || !bairro || !cidade || !uf || !numero) {
      if (window.showToast) window.showToast("Preencha todos os campos do novo endereço.", 'error');
      return false;
    }

    if (isEdit && !Number.isNaN(idx) && enderecos[idx]) {
      enderecos[idx] = { cep, logradouro, bairro, cidade, uf, numero };
      modal.removeAttribute("data-edit-idx");
    } else {
      enderecos.push({ cep, logradouro, bairro, cidade, uf, numero });
    }

    atualizarListaEnderecos();
    window.fecharModalEndereco();
    return false;
  };

  // esc fecha modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") window.fecharModalEndereco();
  });

  // utilitários
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // inicializa (mensagem default)
  document.addEventListener("DOMContentLoaded", () => {
    atualizarListaEnderecos();
  });
})();
