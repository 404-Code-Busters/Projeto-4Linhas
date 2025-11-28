import requests
import asyncio
from fastapi import APIRouter, Request, Form, UploadFile, File, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import os, shutil
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from models.models import *
from models.models import Clientes, Produtos, Pedidos
from auth import *
from controllers.enviar_email import send_welcome_email

router = APIRouter() # rotas
templates = Jinja2Templates(directory="templates") # front-end

# Configuração dos arquivos estáticos
router.mount("/static", StaticFiles(directory="static"), name="static")

# carrinho simples em memória
carrinhos = {}

UPLOAD_DIR = '../static/upload/img'
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
# @router.post("/register")
# def cadastrar_cliente(
#     request:Request,
#     nome:str = Form(...), 
#     cpf:str = Form(...),
#     email:str = Form(...),
#     senha:str = Form(...),
#     telefone:str = Form(...), 
#     # endereco:str = Form(...),
#     db:Session = Depends(get_db)
# ):
    
#     erro = None
#     if len(cpf) != 11:
#         erro = "CPF deve conter 11 dígitos."
#     elif len(telefone) != 11:
#         erro = "Telefone deve conter 11 dígitos."
#     if erro:
#         return templates.TemplateResponse("pages/cadastre-se/cadastre-se.html", {
#             "request": request,
#             "erro": erro,
#             "nome": nome,
#             "cpf": cpf,
#             "email": email,
#             "telefone": telefone
#         })
    
#     cliente = db.query(Clientes).filter(Clientes.email == email).first()
#     if cliente:
#         return templates.TemplateResponse("pages/cadastre-se/cadastre-se.html", {
#             "request": request,
#             "erro": "E-mail já cadastrado!",
#             "nome": nome,
#             "cpf": cpf,
#             "email": email,
#             "telefone": telefone
#         })
#     cliente = db.query(Clientes).filter(Clientes.cpf == cpf).first()
#     if cliente:
#         return templates.TemplateResponse("pages/cadastre-se/cadastre-se.html", {
#             "request": request,
#             "erro": "CPF já cadastrado!",
#             "nome": nome,
#             "cpf": cpf,
#             "email": email,
#             "telefone": telefone
#         })
    
#     senha_hash = gerar_senha(senha) #TODAS AS INFORMAÇÕES ABAIXO ESTÃO ATUALIZADAS - 12/11/2025
#     novo_cliente = Clientes(
#         nome=nome, 
#         cpf=cpf,
#         email=email, 
#         senha=senha_hash,
#         telefone=telefone,
#         # endereco=endereco
#          )
#     db.add(novo_cliente)
#     db.commit()
#     db.refresh(novo_cliente)
#     return RedirectResponse(url="/login", status_code=303)

@router.post("/register")
def cadastrar_cliente(
    request: Request,
    background_tasks: BackgroundTasks,
    nome: str = Form(...),
    cpf: str = Form(...),
    email: str = Form(...),
    senha: str = Form(...),
    telefone: str = Form(...),
    db: Session = Depends(get_db)
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

    # Verifica e-mail existente
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
    
    # Verifica CPF existente
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

    senha_hash = gerar_senha(senha)

    novo_cliente = Clientes(
        nome=nome,
        cpf=cpf,
        email=email,
        senha=senha_hash,
        telefone=telefone
    )

    db.add(novo_cliente)
    db.commit()
    db.refresh(novo_cliente)

    # ---------------------------
    # Envio de e-mail 
    # ---------------------------
    background_tasks.add_task(send_welcome_email, email)

    return RedirectResponse(url="/login", status_code=303)

# Rota para perfil do usuário
@router.get("/perfil", response_class=HTMLResponse, name="perfil")
def perfil(request: Request, db: Session = Depends(get_db)):
    context = get_base_context(request, db)
    cliente = context.get("user")  # 'cliente' agora é o 'user' do contexto

    if not cliente:
        return templates.TemplateResponse("pages/login/login.html", {
            "request": request,
            "timeout": True
        })

    # Buscar itens do carrinho do usuário
    carrinho = carrinhos.get(cliente.id_cliente, [])
    total = sum(item["preco"] * item["quantidade"] for item in carrinho)
    # Buscar pedidos do usuário e enviar ao template (aba Pedidos)
    try:
        pedidos = db.query(Pedidos).filter(Pedidos.id_cliente == cliente.id_cliente).all()
    except Exception:
        pedidos = []

    # Adiciona as informações restantes ao contexto, mantendo 'cliente' para a página
    context.update({
        "cliente": cliente,
        "carrinho": carrinho,
        "total": total,
        "pedidos": pedidos
    })
    return templates.TemplateResponse("pages/perfil/perfil.html", context)


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

# rota favoritos feito por Giovanni 26/11/2025
favoritos = {}

@router.post("/favoritos/adicionar/{produto_id}")
async def adicionar_favoritos(
    request:Request, 
    produto_id:int,
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
    
    lista_favoritos = favoritos.get(cliente.id_cliente, [])
    
    print(f"Adicionando produto {produto_id} aos favoritos do cliente {cliente.id_cliente}")
    print(f"Produto encontrado: {produto.nome}, preço: {produto.preco}, imagem: {produto.imagem_caminho}")

    # Verifica se o produto já existe em favoritos
    produto_existente = None
    for item in favoritos:
        if item["id"] == produto_id:
            produto_existente = item
            break
            
    if produto_existente:
        print(f"Produto já existe em favoritos")
        return JSONResponse({"mensagem":"Produto já está em favoritos"}, status_code=200)
    else:
        novo_item = {
            "id": produto.id_produto,
            "nome": produto.nome,
            "preco": float(produto.preco),  # Converter Decimal para float
            #"quantidade": quantidade,
            "imagem": produto.imagem_caminho
        }
        lista_favoritos.append(novo_item)
        print(f"Novo item adicionado aos favoritos", novo_item)
    
    favoritos[cliente.id_cliente] = lista_favoritos
    print(f"Favoritos atualizados para cliente {cliente.id_cliente}: {lista_favoritos}")
    return JSONResponse({"mensagem": "Produto adicionado aos favoritos", "success": True}, status_code=200)

# Rota favoritos
@router.get("/favoritos", response_class=HTMLResponse, name="favoritos")
async def pagina_favoritos(request:Request, db: Session = Depends(get_db)):
    context = get_base_context(request, db)
    return templates.TemplateResponse("pages/favoritos/favoritos.html", context)

# Rota sobre
@router.get("/sobre", response_class=HTMLResponse, name="sobre")
async def pagina_sobre(request:Request, db: Session = Depends(get_db)):
    context = get_base_context(request, db)
    return templates.TemplateResponse("pages/sobre/sobre.html", context)
