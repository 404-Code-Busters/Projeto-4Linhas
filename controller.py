from fastapi import APIRouter, Request, Form, UploadFile, File, Depends
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import os, shutil
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from models import *
from models import Clientes, Produtos, Pedidos
from auth import *

router = APIRouter() # rotas
templates = Jinja2Templates(directory="templates") # front-end

# Configuração dos arquivos estáticos
router.mount("/static", StaticFiles(directory="static"), name="static")

# carrinho simples em memória
carrinhos = {}

UPLOAD_DIR = './static/'
# caminho para o os
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------- Rotas Principais ----------

# Rota para página inicial (home)
@router.get("/", response_class=HTMLResponse, name="index")
async def home(request:Request):
    return templates.TemplateResponse("pages/home/home.html", {"request":request})

# Rota para catálogo de produtos
@router.get("/catalogo", response_class=HTMLResponse, name="catalogo")
async def catalogo(
    request:Request, 
    db:Session = Depends(get_db),
    q: str = None, # Alteração feita pelo : Parâmetro para a busca por texto (query).
    tamanho: str = None, # Alteração feita pelo : Parâmetro para o filtro de tamanho.
    cor: str = None, # Alteração feita pelo : Parâmetro para o filtro de cor.
    preco_max: float = None # Alteração feita pelo : Parâmetro para o filtro de preço máximo.
):
    try:
        # Alteração feita pelo : A lógica de busca foi movida para o backend para maior eficiência.
        # Em vez de carregar todos os produtos e filtrar no navegador (o que seria lento com muitos itens),
        # o banco de dados, que é otimizado para isso, retorna apenas os produtos que correspondem aos filtros.
        query = db.query(Produtos)
                # Alteração feita pelo : Filtro de busca por nome.
        # Usa 'ilike' para uma busca parcial e que não diferencia maiúsculas de minúsculas (ex: "camisa" encontra "Camisa Polo").
        if q:
            query = query.filter(Produtos.nome.ilike(f"%{q}%"))
        
        # Alteração feita pelo : Filtros por atributos específicos.
        if tamanho:
            query = query.filter(Produtos.tamanho == tamanho)
        if cor:
            query = query.filter(Produtos.cor == cor)
        
        # Alteração feita pelo : Filtro por preço máximo.
        if preco_max:
            query = query.filter(Produtos.preco <= preco_max)

        produtos = query.all()
        
        return templates.TemplateResponse("pages/produtos/produtos.html", {
            "request": request,
            "produtos": produtos
        })
    except Exception as e:
        # Em desenvolvimento, mostra detalhes do erro
        import traceback
        erro_msg = f"Erro ao buscar produtos: {str(e)}"
        tb = traceback.format_exc()
        print(erro_msg)
        print("Traceback completo:")
        print(tb)
        return templates.TemplateResponse("erro.html", {
            "request": request,
            "erro": erro_msg,
            "traceback": tb
        }, status_code=500)

# Rota para detalhes do produto
@router.get("/produto/{id_produto}", response_class=HTMLResponse, name="detalhe_produto")
async def detalhe_produto(request:Request, id_produto:int, db:Session=Depends(get_db)):
    produto = db.query(Produtos).filter(Produtos.id_produto == id_produto).first()
    return templates.TemplateResponse('pages/produto/produto.html', {
        'request':request, 'produto':produto
    })

# Alteração feita pelo : A rota '/produtos/busca' foi removida.
# Sua funcionalidade foi unificada na rota '/catalogo' para simplificar o código e centralizar a lógica.

# ---------- Autenticação e Perfil ----------

# Rota para página de login
@router.get("/login", response_class=HTMLResponse, name="login")
def login_page(request:Request):
    return templates.TemplateResponse("pages/login/login.html", {"request":request})

# Rota para processar login
@router.post("/login")
def login(request: Request, 
        email: str = Form(...),
        senha: str = Form(...), 
        db: Session = Depends(get_db)):
    
    cliente = db.query(Clientes).filter(Clientes.email == email).first()
    if not cliente or not verificar_hash_senha(senha, cliente.senha):
        return {'mensagem': "Credenciais inválidas"}
    
    token = criar_token({"sub": cliente.email,
    "is_admin":cliente.is_admin})

    #Criar um if de admin ou user normal
    if cliente.is_admin:
        destino = "/admin"
    else:
        destino = "/perfil"

    response = RedirectResponse(url=destino, status_code=303)
    response.set_cookie(key="token", value=token, httponly=True)
    return response

# Rota para página de cadastro
@router.get("/cadastro", response_class=HTMLResponse, name="cadastro")
def cadastro_page(request:Request):
    return templates.TemplateResponse("pages/cadastre-se/cadastre-se.html", {
        "request":request
    })

# Rota para processar cadastro
@router.post("/register")
def cadastrar_cliente(
    request:Request,
    nome:str = Form(...), 
    email:str = Form(...),
    senha:str = Form(...), 
    db:Session = Depends(get_db)
):
    cliente = db.query(Clientes).filter(Clientes.email == email).first()
    if cliente:
        return {"mensagem":"E-mail já cadastrado!"}
    
    senha_hash = gerar_senha(senha)
    novo_cliente = Clientes(nome=nome, email=email, senha=senha_hash)
    db.add(novo_cliente)
    db.commit()
    db.refresh(novo_cliente)
    return RedirectResponse(url="/login", status_code=303)

# Rota para perfil do usuário
@router.get("/perfil", response_class=HTMLResponse, name="perfil")
def perfil(request:Request, db:Session = Depends(get_db)):
    token = request.cookies.get("token")
    if not token or not verificar_token(token):
        return RedirectResponse(url="/login", status_code=303)
    
    payload = verificar_token(token)
    email = payload.get("sub")
    cliente = db.query(Clientes).filter(Clientes.email == email).first()
    
    # Buscar itens do carrinho do usuário
    carrinho = carrinhos.get(cliente.id_cliente, [])
    total = sum(item["preco"] * item["quantidade"] for item in carrinho)
    # Buscar pedidos do usuário e enviar ao template (aba Pedidos)
    try:
        pedidos = db.query(Pedidos).filter(Pedidos.id_cliente == cliente.id_cliente).all()
    except Exception:
        # Em caso de modelos diferentes ou erro, fallback para lista vazia
        pedidos = []

    return templates.TemplateResponse("pages/perfil/perfil.html", {
        "request": request,
        "cliente": cliente,
        "carrinho": carrinho,
        "total": total,
        "pedidos": pedidos
    })

# Rota para atualizar senha do perfil
@router.post("/perfil/atualizar-senha", name="atualizar_senha")
def atualizar_senha(request: Request, nova_senha: str = Form(...), db: Session = Depends(get_db)):
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not token or not payload:
        return RedirectResponse(url="/login", status_code=303)
    email = payload.get("sub")
    cliente = db.query(Clientes).filter_by(email=email).first()
    if not cliente:
        return RedirectResponse(url="/login", status_code=303)
    senha_hash = gerar_senha(nova_senha)
    cliente.senha = senha_hash
    db.add(cliente)
    db.commit()
    return RedirectResponse(url="/perfil", status_code=303)

# Rota para logout (remove cookie do token e redireciona)
@router.get("/logout", response_class=HTMLResponse, name="logout")
def logout(request: Request):
    response = RedirectResponse(url="/", status_code=303)
    response.delete_cookie("token")
    return response

# ---------- Carrinho ----------

# Rota para visualizar carrinho completo
@router.get("/carrinho", response_class=HTMLResponse, name="carrinho")
def ver_carrinho(request:Request, db:Session = Depends(get_db)):
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not payload:
        return RedirectResponse(url="/login", status_code=303)
    
    email = payload.get("sub")
    cliente = db.query(Clientes).filter_by(email=email).first()
    carrinho = carrinhos.get(cliente.id_cliente, [])
    total = sum(item["preco"] * item["quantidade"] for item in carrinho)
    
    # Exibir o carrinho dentro da página de perfil (aba Carrinho).
    # Redirecionamos para /perfil — a página de perfil monta o carrinho a partir do estado do servidor.
    return RedirectResponse(url="/perfil", status_code=303)

# Rota para obter o conteúdo do carrinho (para o modal)
@router.get("/carrinho/conteudo", response_class=HTMLResponse)
def carrinho_conteudo(request:Request, db:Session = Depends(get_db)):
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not payload:
        return RedirectResponse(url="/login", status_code=303)
    
    email = payload.get("sub")
    cliente = db.query(Clientes).filter_by(email=email).first()
    carrinho = carrinhos.get(cliente.id_cliente, [])
    total = sum(item["preco"] * item["quantidade"] for item in carrinho)
    
    return templates.TemplateResponse("pages/carrinho/carrinho_modal.html", {
        "request": request,
        "carrinho": carrinho,
        "total": total
    })

# Rota para obter a contagem de itens no carrinho
@router.get("/carrinho/contador")
def carrinho_contador(request:Request, db:Session = Depends(get_db)):
    token = request.cookies.get("token")
    if not token:
        return {"quantidade": 0}

    payload = verificar_token(token)
    if not payload:
        return {"quantidade": 0}

    email = payload.get("sub")
    cliente = db.query(Clientes).filter_by(email=email).first()
    if not cliente:
        return {"quantidade": 0}

    carrinho = carrinhos.get(cliente.id_cliente, [])
    quantidade = sum(item["quantidade"] for item in carrinho)
    return {"quantidade": quantidade}

# Rota para adicionar item ao carrinho
@router.post("/carrinho/adicionar/{produto_id}")
async def adicionar_carrinho(
    request:Request, 
    produto_id:int, 
    quantidade:int = Form(1), 
    db:Session = Depends(get_db)
):
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not payload:
        return JSONResponse({"mensagem": "Login necessário"}, status_code=401)

    email = payload.get("sub")
    cliente = db.query(Clientes).filter_by(email=email).first()
    if not cliente:
        return JSONResponse({"mensagem": "Cliente não encontrado"}, status_code=401)

    produto = db.query(Produtos).filter_by(id_produto=produto_id).first()
    if not produto:
        return JSONResponse({"mensagem": "Produto não encontrado"}, status_code=404)
    
    carrinho = carrinhos.get(cliente.id_cliente, [])
    
    print(f"Adicionando produto {produto_id} ao carrinho do cliente {cliente.id_cliente}")
    print(f"Produto encontrado: {produto.nome}, preço: {produto.preco}, imagem: {produto.imagem_caminho}")
    
    # Verifica se o produto já existe no carrinho
    produto_existente = None
    for item in carrinho:
        if item["id"] == produto_id:
            produto_existente = item
            break
            
    if produto_existente:
        produto_existente["quantidade"] += quantidade
        print(f"Produto já existe no carrinho, nova quantidade: {produto_existente['quantidade']}")
    else:
        novo_item = {
            "id": produto.id_produto,
            "nome": produto.nome,
            "preco": float(produto.preco),  # Converter Decimal para float
            "quantidade": quantidade,
            "imagem": produto.imagem_caminho
        }
        carrinho.append(novo_item)
        print(f"Novo item adicionado ao carrinho: {novo_item}")
    
    carrinhos[cliente.id_cliente] = carrinho
    print(f"Carrinho atualizado para cliente {cliente.id_cliente}: {carrinho}")
    return JSONResponse({"mensagem": "Produto adicionado ao carrinho", "success": True}, status_code=200)

# Rota para atualizar quantidade de item no carrinho
@router.post("/carrinho/atualizar/{produto_id}")
async def atualizar_quantidade(
    request:Request,
    produto_id:int,
    quantidade:int = Form(...),
    db:Session = Depends(get_db)
):
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not payload:
        return RedirectResponse(url="/login", status_code=303)
    
    email = payload.get("sub")
    cliente = db.query(Clientes).filter_by(email=email).first()
    carrinho = carrinhos.get(cliente.id_cliente, [])
    
    for item in carrinho:
        if item["id"] == produto_id:
            item["quantidade"] = quantidade if quantidade > 0 else 1
            break
    
    carrinhos[cliente.id_cliente] = carrinho
    return {"mensagem": "Quantidade atualizada"}

# Rota para remover item do carrinho
@router.post("/carrinho/remover/{produto_id}")
async def remover_do_carrinho(
    request:Request,
    produto_id:int,
    db:Session = Depends(get_db)
):
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not payload:
        return RedirectResponse(url="/login", status_code=303)
    
    email = payload.get("sub")
    cliente = db.query(Clientes).filter_by(email=email).first()
    carrinho = carrinhos.get(cliente.id_cliente, [])
    
    carrinhos[cliente.id_cliente] = [item for item in carrinho if item["id"] != produto_id]
    return {"mensagem": "Produto removido do carrinho"}

# Rota para finalizar compra
@router.post("/checkout")
def checkout(request:Request, db:Session = Depends(get_db)):
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not payload:
        return RedirectResponse(url="/login", status_code=303)
    
    email = payload.get("sub")
    cliente = db.query(Clientes).filter_by(email=email).first()
    carrinho = carrinhos.get(cliente.id_cliente, [])
    
    if not carrinho:
        return {"mensagem": "Carrinho vazio"}
    
    total = sum(item["preco"] * item["quantidade"] for item in carrinho)
    # Correção: Usar os nomes de campo corretos do modelo Pedidos (id_cliente, valor_total)
    # e adicionar valores padrão para os campos obrigatórios (data_pedido, status)
    from datetime import datetime
    pedido = Pedidos(id_cliente=cliente.id_cliente, valor_total=total, data_pedido=datetime.now().strftime("%Y-%m-%d"), status="Processando")
    db.add(pedido)
    db.commit()
    db.refresh(pedido)

    for item in carrinho:
        novo_item = ItemPedido(
            pedido_id=pedido.id_pedido, # Correção: A chave primária de Pedidos é id_pedido
            produto_id=item["id"],
            quantidade=item["quantidade"],
            preco_unitario=item["preco"]
        )
        db.add(novo_item)
    db.commit()
    carrinhos[cliente.id_cliente] = []
    return RedirectResponse(url="/perfil", status_code=303) # Correção: Redirecionar para a página de perfil

# rota para acompanhe
@router.get("/acompanhe", response_class=HTMLResponse, name="acompanhe")
async def acompanhe(request:Request):
    return templates.TemplateResponse("pages/acompanhe/acompanhe.html", {"request":request})

# Duplicate/older route definitions removed to avoid conflicts.
# The routes above provide the canonical implementations for perfil, carrinho and related endpoints.

####################################################################################
####################################################################################
#------------------------------AÇÕES DE UM ADMIN-------------------------------------------
#------------------------------FOI ATUALIZADO SÓ AS FUNÇÕES DESTE BLOCO--------------------

#Rota admin crud nos produtos
@router.get("/admin", response_class=HTMLResponse)
def pagina_admin(request:Request, db:Session=Depends(get_db)):
    #Token do admin
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not payload or not payload.get("is_admin"):
        return RedirectResponse(url="/", status_code=303)
    
    # Buscar dados necessários
    produtos = db.query(Produtos).all()
    pedidos = db.query(Pedidos).all()
    clientes = db.query(Clientes).all()
    
    return templates.TemplateResponse("pages/admin/admin.html", {
        "request": request,
        "produtos": produtos,
        "pedidos": pedidos,
        "clientes": clientes
    })

#Rota criar produto
@router.post("/admin/produto")
def criar_produto(request: Request,
    nome: str = Form(...),
    descricao: str = Form(None),
    preco: float = Form(...),
    tamanho: str = Form(...),
    cor: str = Form(...), 
    imagem: UploadFile = File(None),
    imagem1: UploadFile = File(None),
    imagem2: UploadFile = File(None),
    imagem3: UploadFile = File(None),
    estoque: int = Form(...),
    db: Session = Depends(get_db)
):
    caminho_arquivo = None
    if imagem:
        caminho_arquivo = f"{UPLOAD_DIR}/{imagem.filename}"
        with open(caminho_arquivo, "wb") as arquivo:
            shutil.copyfileobj(imagem.file, arquivo)
    
    novo_produto = Produtos(
        nome=nome,
        descricao=descricao,
        preco=preco,
        tamanho=tamanho,
        cor=cor,
        imagem_caminho=imagem.filename if imagem else None,
        imagem_caminho1=imagem.filename if imagem1 else None,
        imagem_caminho2=imagem.filename if imagem2 else None,
        imagem_caminho3=imagem.filename if imagem3 else None,
        estoque=estoque)
    
    db.add(novo_produto)
    db.commit()
    db.refresh(novo_produto)
    return RedirectResponse(url="/admin", status_code=303)



#Editar produto get edição do produto
@router.get("/admin/produto/editar/{id}", response_class=HTMLResponse)
def editar_produto(id: int, request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not payload or not payload.get("is_admin"):
        return RedirectResponse(url="/", status_code=303)
    produto = db.query(Produtos).filter(Produtos.id == id).first()
    return templates.TemplateResponse("editar.html", {"request": request, "produto": produto})


@router.post("/admin/produto/atualizar/{id}")
def atualizar_produto(id: int,
    nome: str = Form(...),
    descricao: str = Form(None),
    categoria: str = Form(...),
    preco: float = Form(...),
    tamanho: str = Form(...),
    estoque: int = Form(...),
    imagem: UploadFile = File(None),
    db: Session = Depends(get_db)
): # O 'id' aqui é o id_produto do caminho da URL
    produto = db.query(Produtos).filter(Produtos.id_produto == id).first()
    if not produto:
        return RedirectResponse(url="/admin", status_code=303)
    
    produto.nome = nome
    produto.descricao = descricao
    produto.categoria = categoria
    produto.preco = preco
    produto.tamanho = tamanho
    produto.estoque = estoque
    
    if imagem and imagem.filename != "":
        caminho_arquivo = f"{UPLOAD_DIR}/{imagem.filename}"
        with open(caminho_arquivo, "wb") as arquivo:
            shutil.copyfileobj(imagem.file, arquivo)
        produto.imagem_caminho = imagem.filename
    
    db.commit()
    db.refresh(produto)
    return RedirectResponse(url="/admin", status_code=303)


#Deletar produto
@router.post("/admin/produto/deletar/{id}")
def deletar_produto(id: int, db: Session = Depends(get_db)): # O 'id' aqui é o id_produto do caminho da URL
    produto = db.query(Produtos).filter(Produtos.id_produto == id).first()
    if produto:
        db.delete(produto)
        db.commit()
    return RedirectResponse(url="/admin", status_code=303)

#--------------------------------------------------------FIM DAS AÇÕES DE UM ADMIN------------------------------------------------------------------------