- [x] Remover o link CSS do header.css do head em produto.html
- [x] Substituir o bloco <header>...</header> por {% include 'partials/header.html' %} em produto.html
- [x] Testar a página para confirmar funcionamento (servidor iniciado, página acessível em localhost:5000/produto/1)
- [x] Substituir o bloco <header>...</header> por {% include 'partials/header.html' %} em home.html
- [x] Testar a página home para confirmar funcionamento
- [x] Centralizar os links do menu principal no header.css
- [ ] Testar centralização em diferentes tamanhos de tela

          {% elif user <!--Tentar colocar condcional Admin(Caso o user for admin ele tem o acesso direto a tela admin e também a user) -->%}
            <a href="{{ url_for('admin') }}" class="profile-link" aria-label="Admin">
              <img src="{{ url_for('static', path='assets/icons/user.png') }}" alt="Perfil" class="nav-icons profile-icon" style="color: red;">
            </a>