import requests
from fastapi import APIRouter, Request, Form, UploadFile, File, Depends, HTTPException, Query
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

# ---------- Função Auxiliar de Contexto (Adicionado por Gemini) ----------

def get_user_from_token(request: Request, db: Session):
    """Verifica o token no cookie e retorna o objeto do usuário se válido."""
    token = request.cookies.get("token")
    if not token:
        return None
    payload = verificar_token(token)
    if not payload:
        return None
    email = payload.get("sub")
    if not email:
        return None
    return db.query(Clientes).filter(Clientes.email == email).first()

def get_base_context(request: Request, db: Session):
    """Retorna o contexto base para os templates, incluindo o usuário."""
    user = get_user_from_token(request, db)
    return {"request": request, "user": user}

# ---------- Rotas Principais ----------

# Rota para página inicial (home)
@router.get("/", response_class=HTMLResponse, name="index")
async def home(request:Request, db: Session = Depends(get_db)):
    context = get_base_context(request, db)
    return templates.TemplateResponse("pages/home/home.html", context)

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
        # Alteração Gemini: Adiciona o contexto base com o usuário
        context = get_base_context(request, db)

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
        
        # Adiciona os produtos ao contexto e renderiza
        context["produtos"] = produtos
        return templates.TemplateResponse("pages/produtos/produtos.html", context)
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
async def detalhe_produto(request: Request, id_produto: int, db: Session = Depends(get_db)):
    context = get_base_context(request, db)
    produto = db.query(Produtos).filter(Produtos.id_produto == id_produto).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    context["produto"] = produto
    return templates.TemplateResponse('pages/produto/produto.html', context)

# Alteração feita pelo : A rota '/produtos/busca' foi removida.
# Sua funcionalidade foi unificada na rota '/catalogo' para simplificar o código e centralizar a lógica.

# ---------- Autenticação e Perfil ----------

# Rota para página de login
@router.get("/login", response_class=HTMLResponse, name="login")
def login_page(request: Request, db: Session = Depends(get_db)):
    context = get_base_context(request, db)
    return templates.TemplateResponse("pages/login/login.html", context)

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
def cadastro_page(request: Request, db: Session = Depends(get_db)):
    context = get_base_context(request, db)
    return templates.TemplateResponse("pages/cadastre-se/cadastre-se.html", context)

###############################################################
#FALTA TESTAR E APLICAR
#ROTA DE ENDEREÇO
@router.get("/endereco", response_class=HTMLResponse)
def pagina_endereco(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not payload:
        return templates.TemplateResponse("perfil.html", {"request": request})

    email = payload.get("sub")
    cliente = db.query(Clientes).filter_by(email=email).first()

    return templates.TemplateResponse("endereco.html", {
        "request": request,
        "email": cliente.email if cliente else ""
    })


#FALTA TESTAR E APLICAR
@router.post("/salvar_endereco")
def salvar_endereco(
    request: Request,
    logradouro: str = Form(...),
    numero: str = Form(...),
    complemento: str = Form(None),
    bairro: str = Form(...),
    cidade: str = Form(...),
    uf: str = Form(...),
    pais: str = Form(...),
    cep: str = Form(...),
    db: Session = Depends(get_db)
):
    # Verifica token de autenticação
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not payload:
        return RedirectResponse(url="/login", status_code=303)

    email = payload.get("sub")
    cliente = db.query(Clientes).filter_by(email=email).first()

    if not cliente:
        return {"erro": "Cliente não encontrado"}

    # Cria um novo endereço vinculado ao cliente
    #DADOS PEGOS DO BANCO E ATUALIZADOS - DIA 13/11/2025
    novo_endereco = Endereco(
        id_cliente=cliente.id_cliente,
        logradouro=logradouro,
        numero=numero,
        complemento=complemento,
        bairro=bairro,
        cidade=cidade,
        estado=uf,
        pais=pais,
        cep=cep
    )

    db.add(novo_endereco)
    db.commit()
##############################################################

# Rota para processar cadastro #TODAS AS INFORMAÇÕES ABAIXO ESTÃO ATUALIZADAS - 12/11/2025
@router.post("/register")
def cadastrar_cliente(
    request:Request,
    nome:str = Form(...), 
    cpf:str = Form(...),
    email:str = Form(...),
    senha:str = Form(...),
    telefone:str = Form(...), 
    # endereco:str = Form(...),
    db:Session = Depends(get_db)
):
    
    erro = None
    if len(cpf) != 11:
        erro = "CPF deve conter 11 dígitos."
    elif len(telefone) != 11:
        erro = "Telefone deve conter 11 dígitos."
    if erro:
        return templates.TemplateResponse("pages/cadastre-se/cadastre-se.html", {
            "request": request,
            "erro": erro,
            "nome": nome,
            "cpf": cpf,
            "email": email,
            "telefone": telefone
        })
    
    cliente = db.query(Clientes).filter(Clientes.email == email).first()
    if cliente:
        return templates.TemplateResponse("pages/cadastre-se/cadastre-se.html", {
            "request": request,
            "erro": "E-mail já cadastrado!",
            "nome": nome,
            "cpf": cpf,
            "email": email,
            "telefone": telefone
        })
    cliente = db.query(Clientes).filter(Clientes.cpf == cpf).first()
    if cliente:
        return templates.TemplateResponse("pages/cadastre-se/cadastre-se.html", {
            "request": request,
            "erro": "CPF já cadastrado!",
            "nome": nome,
            "cpf": cpf,
            "email": email,
            "telefone": telefone
        })
    
    senha_hash = gerar_senha(senha) #TODAS AS INFORMAÇÕES ABAIXO ESTÃO ATUALIZADAS - 12/11/2025
    novo_cliente = Clientes(
        nome=nome, 
        cpf=cpf,
        email=email, 
        senha=senha_hash,
        telefone=telefone,
        # endereco=endereco
         )
    db.add(novo_cliente)
    db.commit()
    db.refresh(novo_cliente)
    return RedirectResponse(url="/login", status_code=303)

# Rota para perfil do usuário
@router.get("/perfil", response_class=HTMLResponse, name="perfil")
def perfil(request:Request, db:Session = Depends(get_db)):
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not token or not payload:
        # Passa mensagem de timeout para login
        return templates.TemplateResponse("pages/login/login.html", {
            "request": request,
            "timeout": True
        })

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


# Rota para página de checkout
# Observação: rota adicionada por GitHub Copilot (assistente)
@router.get("/checkout", response_class=HTMLResponse, name="checkout")
def pagina_checkout(request: Request, db: Session = Depends(get_db)):    
    context = get_base_context(request, db)
    if not context.get("user"):
        return RedirectResponse(url="/login", status_code=303)
    
    carrinho = carrinhos.get(context["user"].id_cliente, [])
    total = sum(item["preco"] * item["quantidade"] for item in carrinho)

    context.update({"carrinho": carrinho, "total": total})
    return templates.TemplateResponse("pages/checkout/checkout.html", context)

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

# Rota para obter os itens do carrinho em formato JSON (para o novo modal)
@router.get("/carrinho/itens")
def get_carrinho_itens(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not payload:
        return JSONResponse({"error": "Não autenticado"}, status_code=401)

    email = payload.get("sub")
    cliente = db.query(Clientes).filter_by(email=email).first()
    if not cliente:
        return JSONResponse({"error": "Cliente não encontrado"}, status_code=401)

    carrinho = carrinhos.get(cliente.id_cliente, [])
    total = sum(item["preco"] * item["quantidade"] for item in carrinho)

    return JSONResponse({
        "itens": carrinho,
        "total": total
    })

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
# @router.post("/checkout")
# def checkout(request:Request, db:Session = Depends(get_db)):
#     token = request.cookies.get("token")
#     payload = verificar_token(token)
#     if not payload:
#         return RedirectResponse(url="/login", status_code=303)
    
#     email = payload.get("sub")
#     cliente = db.query(Clientes).filter_by(email=email).first()
#     carrinho = carrinhos.get(cliente.id_cliente, [])

    
#     if not carrinho:
#         return {"mensagem": "Carrinho vazio"}
    
#     total = sum(item["preco"] * item["quantidade"] for item in carrinho)
#     # Correção: Usar os nomes de campo corretos do modelo Pedidos (id_cliente, valor_total)
#     # e adicionar valores padrão para os campos obrigatórios (data_pedido, status)
#     from datetime import datetime
#     pedido = Pedidos(id_cliente=cliente.id_cliente,
#                     valor_total=total,
#                     data_pedido=datetime.now().strftime("%Y-%m-%d"),
#                     status="Processando",
#                           )
#     db.add(pedido)
#     db.commit()
#     db.refresh(pedido)

#     for item in carrinho:
#         novo_item = ItemPedido(
#             pedido_id=pedido.id_pedido, # Correção: A chave primária de Pedidos é id_pedido
#             produto_id=item["id"],
#             quantidade=item["quantidade"],
#             preco_unitario=item["preco"]
#         )
#         db.add(novo_item)
#     db.commit()
#     carrinhos[cliente.id_cliente] = []
#     return RedirectResponse(url="/perfil", status_code=303) # Correção: Redirecionar para a página de perfil

#rota checkout
@router.post("/checkout")
async def checkout(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("token")
    payload = verificar_token(token)

    if not payload:
        return RedirectResponse(url="/login", status_code=303)

    email = payload.get("sub")
    cliente = db.query(Clientes).filter_by(email=email).first()

    carrinho = carrinhos.get(cliente.id_cliente, [])
    if not carrinho:
        return templates.TemplateResponse("pages/checkout/checkout.html", {
            "request": request,
            "cliente": cliente,
            "carrinho": carrinho,
            "total": 0,
            "erro": "Carrinho vazio"
        })

    # Tenta obter endereço enviado pelo formulário (ex: usuário preencheu no checkout)
    form = await request.form()
    form_logradouro = form.get("logradouro")
    form_numero = form.get("numero")
    form_bairro = form.get("bairro")
    form_cidade = form.get("cidade")
    form_uf = form.get("uf")
    form_cep = form.get("cep")

    endereco_obj = db.query(Endereco).filter_by(id_cliente=cliente.id_cliente).first()

    # Decide qual endereço usar: formulário > tabela Endereco > campo cliente.endereco
    if form_logradouro:
        endereco_str = f"{form_logradouro}, {form_numero or ''} - {form_bairro or ''} - {form_cidade or ''} - {form_uf or ''}"
        cep_used = form_cep or ""
        # Se usuário optou por salvar, persiste/atualiza endereço no banco
        if form.get('salvar_endereco'):
            if endereco_obj:
                endereco_obj.logradouro = form_logradouro
                endereco_obj.numero = form_numero
                endereco_obj.bairro = form_bairro
                endereco_obj.cidade = form_cidade
                endereco_obj.estado = form_uf
                endereco_obj.cep = form_cep
                db.add(endereco_obj)
            else:
                novo_end = Endereco(
                    id_cliente=cliente.id_cliente,
                    logradouro=form_logradouro,
                    numero=form_numero,
                    complemento=None,
                    bairro=form_bairro,
                    cidade=form_cidade,
                    estado=form_uf,
                    pais='Brasil',
                    cep=form_cep
                )
                db.add(novo_end)
            db.commit()
    elif endereco_obj:
        endereco_str = f"{endereco_obj.logradouro}, {endereco_obj.numero or ''} - {endereco_obj.bairro or ''} - {endereco_obj.cidade or ''} - {endereco_obj.estado or ''}"
        cep_used = endereco_obj.cep or ""
    elif getattr(cliente, 'endereco', None):
        endereco_str = cliente.endereco
        cep_used = ""
    else:
        # Nenhum endereço disponível: retorna para a página de checkout com erro legível
        total_produtos = sum(item["preco"] * item["quantidade"] for item in carrinho)
        return templates.TemplateResponse("pages/checkout/checkout.html", {
            "request": request,
            "cliente": cliente,
            "carrinho": carrinho,
            "total": total_produtos,
            "erro": "Nenhum endereço cadastrado. Cadastre um endereço ou preencha os dados no checkout antes de finalizar."
        })

    total_produtos = sum(item["preco"] * item["quantidade"] for item in carrinho)
    valor_frete = 15.90
    total_final = total_produtos + valor_frete

    from datetime import datetime

    # Só cria o pedido se o formulário veio da etapa de pagamento
    # Verifica se veio o campo 'payment' (PIX, cartão, etc)
    payment_method = form.get('payment')
    if not payment_method:
        # Se não veio, volta para o checkout na etapa correta
        return templates.TemplateResponse("pages/checkout/checkout.html", {
            "request": request,
            "cliente": cliente,
            "carrinho": carrinho,
            "total": total_produtos,
            "erro": "Finalize o pagamento para confirmar o pedido."
        })

    # Criar o pedido
    pedido = Pedidos(
        id_cliente=cliente.id_cliente,
        endereco_entrega=endereco_str,
        cep_entrega=cep_used,
        valor_frete=valor_frete,
        data_pedido=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="Processando",
        valor_total=total_final
    )

    db.add(pedido)
    db.commit()
    db.refresh(pedido)

    # Criar itens desse pedido
    for item in carrinho:
        novo_item = ItemPedido(
            pedido_id=pedido.id_pedido,
            produto_id=item["id"],
            quantidade=item["quantidade"],
            preco_unitario=item["preco"]
        )
        db.add(novo_item)

    db.commit()

    carrinhos[cliente.id_cliente] = []

    # Redireciona para página de confirmação com id do pedido
    return RedirectResponse(url=f"/pedidos/confirmacao?id={pedido.id_pedido}", status_code=303)


# Rota de confirmação de pedido
@router.get("/pedidos/confirmacao", response_class=HTMLResponse)
def pedido_confirmacao(request: Request, id: int = None, db: Session = Depends(get_db)):
    if not id:
        return templates.TemplateResponse("pages/pedidos/confirmacao.html", {"request": request, "pedido": None})

    pedido = db.query(Pedidos).filter(Pedidos.id_pedido == id).first()
    return templates.TemplateResponse("pages/pedidos/confirmacao.html", {"request": request, "pedido": pedido})


# rota para acompanhe
@router.get("/acompanhe", response_class=HTMLResponse, name="acompanhe")
async def acompanhe(request: Request, db: Session = Depends(get_db)):
    context = get_base_context(request, db)
    return templates.TemplateResponse("pages/acompanhe/acompanhe.html", context)


CEP_LOJA = "03008020"  # CEP 

@router.get("/api/endereco")#FEITO PELO PIETRO - 13/11/2025
def calcular_endereco(
    request: Request,
    cep_destino: str = Query(...),
    db: Session = Depends(get_db)
):
    # Autenticação obrigatória
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Usuário não autenticado")

    # Validação do CEP
    if not cep_destino.isdigit() or len(cep_destino) != 8:
        raise HTTPException(status_code=400, detail="CEP inválido")

    # Consulta no ViaCEP
    via_cep_url = f"https://viacep.com.br/ws/{cep_destino}/json/"
    resposta = requests.get(via_cep_url)

    if resposta.status_code != 200:
        raise HTTPException(status_code=400, detail="Erro ao consultar o CEP")

    dados = resposta.json()
    if "erro" in dados:
        raise HTTPException(status_code=400, detail="CEP não encontrado")

    return dados  # devolve o JSON do ViaCEP diretamente

#rota que calcula o frete FEITO PELO PIETRO - 13/11/2025
@router.get("/api/frete")
def calcular_frete(
    request: Request,
    cep_destino: str = Query(...),
    db: Session = Depends(get_db)
):
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Usuário não autenticado")

    if not cep_destino.isdigit() or len(cep_destino) != 8:
        raise HTTPException(status_code=400, detail="CEP inválido")

    # Consulta correta ao ViaCEP
    via_cep_url = f"https://viacep.com.br/ws/{cep_destino}/json/"
    resposta = requests.get(via_cep_url)  # <--- CORRETO

    if resposta.status_code != 200:
        raise HTTPException(status_code=400, detail="Erro ao consultar o CEP")

    dados = resposta.json()
    if "erro" in dados:
        raise HTTPException(status_code=400, detail="CEP não encontrado")

    valor_frete = 15.00
    prazo_estimado = 5

    return {
        "endereco": f"{dados.get('logradouro')} - {dados.get('bairro')} - {dados.get('localidade')} - {dados.get('uf')}",
        "cep": cep_destino,
        "valor_frete": valor_frete,
        "prazo_estimado_dias": prazo_estimado,
        "status": "Simulação concluída"
    }

#rota para calcular o frete
@router.get("/frete", response_class=HTMLResponse)
def pagina_frete(request: Request):
    return templates.TemplateResponse("teste_frete.html", {"request": request})


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
@router.post("/admin/produto")#TODAS AS INFORMAÇÕES ABAIXO ESTÃO ATUALIZADAS - 12/11/2025
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
    # Função auxiliar para salvar imagens e retornar o nome do arquivo
    def salvar_upload_file(upload_file: UploadFile):
        if upload_file and upload_file.filename:
            caminho_arquivo = os.path.join(UPLOAD_DIR, upload_file.filename)
            with open(caminho_arquivo, "wb") as buffer:
                shutil.copyfileobj(upload_file.file, buffer)
            return upload_file.filename
        return None

    # Salva cada imagem e obtém seu nome de arquivo
    nome_imagem = salvar_upload_file(imagem)
    nome_imagem1 = salvar_upload_file(imagem1)
    nome_imagem2 = salvar_upload_file(imagem2)
    nome_imagem3 = salvar_upload_file(imagem3)
    
    novo_produto = Produtos( #TODAS AS INFORMAÇÕES ABAIXO ESTÃO ATUALIZADAS - 12/11/2025
        nome=nome,
        descricao=descricao,
        preco=preco,
        tamanho=tamanho,
        cor=cor,
        imagem_caminho=nome_imagem,
        imagem_caminho1=nome_imagem1,
        imagem_caminho2=nome_imagem2,
        imagem_caminho3=nome_imagem3,
        estoque=estoque
    )
    
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


@router.post("/admin/produto/atualizar/{id}")#TODAS AS INFORMAÇÕES ABAIXO ESTÃO ATUALIZADAS - 12/11/2025
def atualizar_produto(id: int,
    nome: str = Form(...),
    descricao: str = Form(None),
    categoria: str = Form(...),
    cor: str = Form(...),
    preco: float = Form(...),
    tamanho: str = Form(...),
    estoque: int = Form(...),
    imagem: UploadFile = File(None),
    imagem1: UploadFile = File(None),
    imagem2: UploadFile = File(None),
    imagem3: UploadFile = File(None),
    db: Session = Depends(get_db)
): # O 'id' aqui é o id_produto do caminho da URL
    produto = db.query(Produtos).filter(Produtos.id_produto == id).first()
    if not produto:
        return RedirectResponse(url="/admin", status_code=303)
    
    # Função auxiliar para salvar imagens
    def salvar_upload_file(upload_file: UploadFile):
        if upload_file and upload_file.filename:
            caminho_arquivo = os.path.join(UPLOAD_DIR, upload_file.filename)
            with open(caminho_arquivo, "wb") as buffer:
                shutil.copyfileobj(upload_file.file, buffer)
            return upload_file.filename
        return None

    # Atualiza os campos do produto
    produto.nome = nome
    produto.descricao = descricao
    # produto.categoria = categoria # O campo categoria não existe no modelo Produtos
    produto.cor = cor
    produto.preco = preco
    produto.tamanho = tamanho
    produto.estoque = estoque
    
    # Atualiza as imagens se novos arquivos forem enviados
    if nome_imagem := salvar_upload_file(imagem):
        produto.imagem_caminho = nome_imagem
    if nome_imagem1 := salvar_upload_file(imagem1):
        produto.imagem_caminho1 = nome_imagem1
    if nome_imagem2 := salvar_upload_file(imagem2):
        produto.imagem_caminho2 = nome_imagem2
    if nome_imagem3 := salvar_upload_file(imagem3):
        produto.imagem_caminho3 = nome_imagem3
    
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