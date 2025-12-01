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
        const enderecoParts = data.endereco.split(" - ");
        if (logradouroInput) logradouroInput.value = enderecoParts[0] || "";
        if (bairroInput) bairroInput.value = enderecoParts[1] || "";
        if (cidadeInput) cidadeInput.value = enderecoParts[2] || "";
        if (ufInput) ufInput.value = enderecoParts[3] || "";

        // Se conseguir extrair a cidade, faz geocoding para posicionar o mapa
        if (enderecoParts[2] && enderecoParts[3] && map) {
          const geocodingUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${enderecoParts[2]}, ${enderecoParts[3]}, Brasil`;
          
          fetch(geocodingUrl)
            .then((response) => response.json())
            .then((results) => {
              if (results.length > 0) {
                const location = [parseFloat(results[0].lat), parseFloat(results[0].lon)];
                map.setView(location, 15);
                marker.setLatLng(location);
              }
            })
            .catch((error) => console.error("Erro ao geocodificar:", error));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
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
      alert("Preencha todos os campos do novo endereço.");
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
        alert('Endereço salvo com sucesso.');
        return false;
      } else {
        console.error('Resposta inesperada ao salvar endereço', data);
        alert('Não foi possível salvar o endereço. Veja o console para detalhes.');
      }
    } catch (err) {
      console.error('Erro ao salvar endereço:', err);
      alert('Erro ao salvar endereço. Veja o console.');
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
        if (!confirm('Remover este endereço?')) return;

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
            alert('Endereço removido com sucesso.');
          } else {
            alert('Erro ao remover endereço');
          }
        } catch (err) {
          console.error('Erro ao remover endereço:', err);
          alert('Erro ao remover endereço. Veja o console.');
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
