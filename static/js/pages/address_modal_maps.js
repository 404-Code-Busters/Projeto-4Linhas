// static/js/pages/address_modal_maps.js
// Código compatível com seu HTML (funções globais chamadas pelos onclick do template).
// Com integração do OpenStreetMap + Leaflet (GRATUITO)

(function () {
  // referências
  const modal = document.getElementById("modal-endereco");
  const listaEl = document.getElementById("enderecos-lista");
  const cepInput = document.getElementById("modal-cep");
  const logradouroInput = document.getElementById("modal-logradouro");
  const bairroInput = document.getElementById("modal-bairro");
  const cidadeInput = document.getElementById("modal-cidade");
  const ufInput = document.getElementById("modal-uf");
  const mapContainer = document.getElementById("map-container");

  // dados em memória
  let enderecos = [];
  let map = null;
  let marker = null;

  // --- Modal de confirmação reutilizável ---
  let _confirmModalReady = false;
  function ensureConfirmModal() {
    if (_confirmModalReady) return;
    _confirmModalReady = true;

    // estilos básicos e responsivos
    const style = document.createElement('style');
    style.textContent = `
      .confirm-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:2000}
      .confirm-box{background:#fff;padding:16px;border-radius:12px;max-width:480px;width:94%;box-shadow:0 8px 24px rgba(0,0,0,0.2);font-family:Inter,system-ui,Arial;color:#0b2540}
      .confirm-title{font-weight:700;margin-bottom:8px;font-size:16px}
      .confirm-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}
      .confirm-btn{padding:8px 12px;border-radius:8px;border:none;cursor:pointer;font-weight:600}
      .confirm-cancel{background:#f3f4f6;color:#0b2540}
      .confirm-ok{background:#ef4444;color:#fff}
      @media(min-width:640px){.confirm-box{width:420px}}
    `;
    document.head.appendChild(style);

    // container
    const container = document.createElement('div');
    container.className = 'confirm-backdrop';
    container.style.display = 'none';

    container.innerHTML = `
      <div class="confirm-box" role="dialog" aria-modal="true">
        <div class="confirm-title">Confirmação</div>
        <div class="confirm-message">Tem certeza?</div>
        <div class="confirm-actions">
          <button class="confirm-btn confirm-cancel">Cancelar</button>
          <button class="confirm-btn confirm-ok">Excluir</button>
        </div>
      </div>`;

    document.body.appendChild(container);

    // eventos
    const cancelBtn = container.querySelector('.confirm-cancel');
    const okBtn = container.querySelector('.confirm-ok');
    const messageEl = container.querySelector('.confirm-message');

    let resolver = null;

    cancelBtn.addEventListener('click', () => {
      container.style.display = 'none';
      if (resolver) { resolver(false); resolver = null; }
    });

    okBtn.addEventListener('click', () => {
      container.style.display = 'none';
      if (resolver) { resolver(true); resolver = null; }
    });

    // fechar ao clicar fora
    container.addEventListener('click', (e) => {
      if (e.target === container) {
        container.style.display = 'none';
        if (resolver) { resolver(false); resolver = null; }
      }
    });

    // exporta função de uso
    window.showConfirmModal = function (message) {
      ensureConfirmModal();
      messageEl.textContent = message || 'Tem certeza?';
      container.style.display = 'flex';
      return new Promise((resolve) => { resolver = resolve; });
    };
  }

  // Inicializa o mapa Leaflet quando carregado
  function initMap() {
    if (!mapContainer) return;
    
    // Localização padrão: São Paulo
    const defaultLocation = [-23.5505, -46.6333];
    
    // Cria mapa
    map = L.map(mapContainer).setView(defaultLocation, 15);
    
    // Adiciona tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Cria marker que pode ser arrastado
    marker = L.marker(defaultLocation, {
      draggable: true,
      title: "Clique e arraste para escolher seu endereço",
    }).addTo(map);

    // Ao arrastar o marker
    marker.on("dragend", function () {
      const position = marker.getLatLng();
      preencherCamposDoMapa(position.lat, position.lng);
    });

    // Ao clicar no mapa
    map.on("click", function (event) {
      marker.setLatLng(event.latlng);
      preencherCamposDoMapa(event.latlng.lat, event.latlng.lng);
    });
  }

  // Reverse geocoding (gratuito com Nominatim do OpenStreetMap)
  function preencherCamposDoMapa(lat, lng) {
    // API Nominatim do OpenStreetMap (gratuito)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const address = data.address || {};
        
        // Extrai componentes do endereço
        const rua = address.road || "";
        const numero = address.house_number || "";
        const bairro = address.suburb || address.neighbourhood || "";
        const cidade = address.city || address.town || "";
        const estado = address.state || "";
        const cep = address.postcode || "";

        // Preenche os campos
        if (logradouroInput) logradouroInput.value = rua;
        if (document.getElementById("modal-numero")) document.getElementById("modal-numero").value = numero;
        if (bairroInput) bairroInput.value = bairro;
        if (cidadeInput) cidadeInput.value = cidade;
        if (ufInput) ufInput.value = estado;
        if (cepInput) cepInput.value = cep.replace(/\D/g, "");
      })
      .catch((error) => {
        console.error("Erro no reverse geocoding:", error);
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
        // `endereco` é retornado pelo backend no formato "logradouro - bairro - cidade - UF"
        const enderecoRaw = (data && data.endereco) ? data.endereco : '';
        const enderecoParts = enderecoRaw ? enderecoRaw.split(" - ") : [];
        if (logradouroInput) logradouroInput.value = enderecoParts[0] || "";
        if (bairroInput) bairroInput.value = enderecoParts[1] || "";
        if (cidadeInput) cidadeInput.value = enderecoParts[2] || "";
        if (ufInput) ufInput.value = enderecoParts[3] || "";

        // Se tivermos um endereço completo, geocodifica-o (mais preciso que usar só cidade/UF)
        if (enderecoRaw && map) {
          const q = encodeURIComponent(enderecoRaw + ', Brasil');
          const geocodingUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&q=${q}&limit=1`;
          fetch(geocodingUrl, { headers: { 'Accept-Language': 'pt-BR' } })
            .then((response) => response.json())
            .then((results) => {
              if (results && results.length > 0) {
                const location = [parseFloat(results[0].lat), parseFloat(results[0].lon)];
                map.setView(location, 18);
                marker.setLatLng(location);
              } else {
                // fallback: se não achar com logradouro, buscar por cidade/uf
                if (enderecoParts[2] && enderecoParts[3]) {
                  const cityQ = encodeURIComponent(enderecoParts[2] + ', ' + enderecoParts[3] + ', Brasil');
                  const cityUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&q=${cityQ}&limit=1`;
                  return fetch(cityUrl).then(r => r.json()).then(res2 => {
                    if (res2 && res2.length > 0) {
                      const loc = [parseFloat(res2[0].lat), parseFloat(res2[0].lon)];
                      map.setView(loc, 15);
                      marker.setLatLng(loc);
                    }
                  });
                }
              }
            })
            .catch((error) => console.error("Erro ao geocodificar:", error));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    });
    // Suporte a tecla Enter: dispara a busca (ativando o blur)
    cepInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.blur();
      }
    });
  }

  // expõe funções globais (porque seu HTML usa onclick inline)
  window.abrirModalEndereco = function () {
    if (!modal) return console.warn("Modal não encontrado: id='modal-endereco'");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    // Inicializa mapa quando abre modal
    if (map === null && mapContainer) {
      setTimeout(() => {
        initMap();
        // Força redimensionamento do mapa
        map.invalidateSize();
      }, 100);
    }

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
    // remove qualquer indicador de edição
    if (modal) modal.removeAttribute('data-edit-id');
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

  // salvar e renderizar
  window.salvarEndereco = async function (ev) {
    if (ev && ev.preventDefault) ev.preventDefault();

    const cep = document.getElementById("modal-cep")?.value?.trim() || "";
    const logradouro = logradouroInput?.value?.trim() || "";
    const bairro = bairroInput?.value?.trim() || "";
    const cidade = cidadeInput?.value?.trim() || "";
    const uf = ufInput?.value?.trim() || "";
    const numero = document.getElementById("modal-numero")?.value?.trim() || "";
    const complemento = document.getElementById("modal-complemento") ? document.getElementById("modal-complemento").value.trim() : "";

    if (!cep || !logradouro || !bairro || !cidade || !uf || !numero) {
      if (window.showToast) window.showToast("Preencha todos os campos do novo endereço.", 'error');
      return false;
    }

    // se está editando, pega o id
    const editId = modal?.getAttribute('data-edit-id');

    const formData = new FormData();
    formData.append('cep', cep);
    formData.append('logradouro', logradouro);
    formData.append('numero', numero);
    formData.append('complemento', complemento || '');
    formData.append('bairro', bairro);
    formData.append('cidade', cidade);
    formData.append('uf', uf);
    formData.append('pais', 'Brasil');
    if (editId) formData.append('id_endereco', editId);

    try {
      const resp = await fetch('/salvar_endereco', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });

      if (!resp.ok) throw new Error('Erro ao salvar endereço');
      const data = await resp.json();

      if (data && data.success && data.endereco) {
        const saved = data.endereco;
        // atualizar array local
        if (editId) {
          const idx = enderecos.findIndex(x => String(x.id_endereco) === String(editId));
          if (idx >= 0) enderecos[idx] = saved;
        } else {
          enderecos.push(saved);
        }
        atualizarListaEnderecos();
        window.fecharModalEndereco();
        // feedback visual para o usuário
        if (window.showToast) window.showToast('Endereço salvo com sucesso.', 'success');
        return false;
      } else {
        console.error('Resposta inesperada ao salvar endereço', data);
        if (window.showToast) window.showToast('Não foi possível salvar o endereço. Veja o console para detalhes.', 'error');
      }
    } catch (err) {
      console.error('Erro ao salvar endereço:', err);
      if (window.showToast) window.showToast('Erro ao salvar endereço. Veja o console.', 'error');
    }

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
        <div class="endereco-item-content">
          <div class="endereco-item-details">
            <strong>${escapeHtml(e.logradouro)}, ${escapeHtml(e.numero)}</strong><br>
            ${escapeHtml(e.bairro)} — ${escapeHtml(e.cidade)} / ${escapeHtml(e.estado || e.uf)}<br>
            <small class="endereco-item-cep">CEP: ${escapeHtml(e.cep)}</small>
          </div>
          <div class="endereco-item-actions">
            <button data-id="${e.id_endereco || i}" class="addr-edit-btn" type="button">Editar</button>
            <button data-id="${e.id_endereco || i}" class="addr-remove-btn" type="button">Excluir</button>
          </div>
        </div>
      `;
      listaEl.appendChild(item);
    });

    // attach events to edit/remove
    listaEl.querySelectorAll(".addr-remove-btn").forEach(btn => {
      btn.addEventListener("click", async (ev) => {
        const id = ev.currentTarget.getAttribute("data-id");
        if (!id) return;

        // mostra modal de confirmação
        ensureConfirmModal();
        const confirmed = await window.showConfirmModal('Tem certeza que deseja excluir este endereço?');
        if (!confirmed) return;

        const form = new FormData();
        form.append('id_endereco', id);

        try {
          const resp = await fetch('/api/enderecos/remover', { method: 'POST', body: form, credentials: 'same-origin' });
          if (!resp.ok) throw new Error('Erro ao remover');
          const data = await resp.json();
          if (data && data.success) {
            // remover localmente
            const idx = enderecos.findIndex(x => String(x.id_endereco) === String(id));
            if (idx >= 0) enderecos.splice(idx, 1);
            atualizarListaEnderecos();
            // feedback leve via modal padrão do navegador substituído por alert foi removido
            // Podemos usar uma notificação menos intrusiva no futuro
          } else {
            // em caso de erro, mostrar toast de erro
            if (window.showToast) window.showToast('Não foi possível remover o endereço.', 'error');
          }
        } catch (err) {
          console.error('Erro ao remover endereço:', err);
          if (window.showToast) window.showToast('Erro ao remover endereço. Veja o console.', 'error');
        }
      });
    });

    // editar abre modal populando campos
    listaEl.querySelectorAll(".addr-edit-btn").forEach(btn => {
      btn.addEventListener("click", (ev) => {
        const id = ev.currentTarget.getAttribute("data-id");
        if (!id) return;
        const data = enderecos.find(x => String(x.id_endereco) === String(id));
        if (!data) return;
        // preenche modal
        if (cepInput) cepInput.value = data.cep;
        if (logradouroInput) logradouroInput.value = data.logradouro;
        if (bairroInput) bairroInput.value = data.bairro;
        if (cidadeInput) cidadeInput.value = data.cidade;
        if (ufInput) ufInput.value = data.estado || data.uf || '';
        document.getElementById("modal-numero").value = data.numero;
        // optional complemento field
        if (document.getElementById('modal-complemento')) document.getElementById('modal-complemento').value = data.complemento || '';

        // guarda id para edição
        modal.setAttribute("data-edit-id", data.id_endereco);
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";

        // Inicializa mapa se não estiver
        if (map === null && mapContainer) {
          setTimeout(() => {
            initMap();
            map.invalidateSize();
          }, 100);
        }
      });
    });
  }

  // Ao submeter (salvar) quando estamos editando, substituir em vez de push
  

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
    // carregue endereços salvos do servidor
    (async function loadEnderecos() {
      try {
        const resp = await fetch('/api/enderecos', { credentials: 'same-origin' });
        if (!resp.ok) throw new Error('Erro ao buscar endereços');
        const data = await resp.json();
        if (data && data.success && Array.isArray(data.enderecos)) {
          enderecos = data.enderecos;
        }
      } catch (err) {
        console.warn('Não foi possível carregar endereços do servidor:', err);
      }
      atualizarListaEnderecos();
    })();
  });
})();
