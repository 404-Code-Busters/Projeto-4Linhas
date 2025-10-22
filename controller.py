from fastapi import APIRouter, Request, Form, UploadFile, File, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
import os, shutil
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from models import *
from models import Clientes, Produtos, Pedidos
from auth import *

router = APIRouter() # rotas
templates = Jinja2Templates(directory="templates") # front-end

UPLOAD_DIR = './static/uploads'
# caminho para o os
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------- Produtos ----------

# rota para listar produtos
@router.get("/", response_class=HTMLResponse)
async def listar_produtos(request:Request, db:Session = Depends(get_db)):
    produtos = db.query(Produtos).all() # serve para puxar os produtos do banco de dados
    return templates.TemplateResponse("index.html", {"request":request, "produtos":produtos})

# rota para listar único produto
@router.get("/produto/id/{id_produto}", response_class=HTMLResponse)
async def detalhe_produto(request:Request, id_produto:int, db:Session=Depends(get_db)):
    produto = db.query(Produtos).filter(Produtos.id_produto == id_produto).first()
    return templates.TemplateResponse('produto.html', {
        'request':request, 'produto':produto
    })

# produto pelo nome
@router.get("/produto/nome/{nome_produto}", response_class=HTMLResponse)
async def produto_nome(request:Request, nome_produto:str, db:Session=Depends(get_db)):
    produto = db.query(Produtos).filter(Produtos.nome == nome_produto).first()
    return templates.TemplateResponse('produto.html', {
        'request':request, 'produto':produto
    })

# puxar produto pelo tamnho
@router.get("/produto/tamanho/{tamanho_produto}", response_class=HTMLResponse)
async def produto_tamanho(request:Request, tamanho_produto:str, db:Session=Depends(get_db)):
    produto = db.query(Produtos).filter(Produtos.tamanho == tamanho_produto).first()
    return templates.TemplateResponse('produto.html', {
        'request':request, 'produto':produto
    })


# produtos pelo preco
@router.get("/produto/preco/{preco_produto}")
async def produto_preco(request:Request, preco_produto:float, db:Session=Depends(get_db)):
    produto = db.query(Produtos).filter(Produtos.preco == preco_produto).first()
    return templates.TemplateResponse('produto.html', {
        'request':request, 'produto':produto
    })

# ---------- Clientes ----------

# cadastro de usuário
@router.get("/register", response_class=HTMLResponse)
def pagina_cadastro(request:Request):
    return templates.TemplateResponse("register.html", {
        "request":request
    })

# formulário para criar usuário
@router.post("/register")
def cadastrar_Clientes(request:Request,
    nome:str = Form(...), email:str = Form(...),
    senha:str = Form(...), db:Session = Depends(get_db)
):
    Clientes = db.query(Clientes).filter(Clientes.email == email).first()
    if Clientes:
        return {"mensagem":"E-mail já cadastrado!"}
    senha_hash = gerar_senha(senha)
    novo_Clientes = Clientes(nome=nome, email=email, senha=senha_hash)
    db.add(novo_Clientes)
    db.commit()
    db.refresh(novo_Clientes)
    return RedirectResponse(url="/", status_code=303)

# rota de login
@router.get("/login", response_class=HTMLResponse)
def home(request:Request):
    return templates.TemplateResponse("login.html",{"request":request})

# post login do usuário
@router.post("/login")
def login(request: Request, 
        email: str = Form(...),
        senha:str=Form(...), 
        db:Session=Depends(get_db)):
    
    clientes = db.query(Clientes).filter(Clientes.email== email).first()
    if not clientes or not verificar_hash_senha(senha, clientes.senha):
        return {'mensagem':"Credenciais inválidas"}
    else:
        token = criar_token({"sub":clientes.email})
        response = RedirectResponse(url="/dashboard", status_code=303)
        response.set_cookie(key="token", value=token, httponly=True)
        return response

# criar roya do dashboard do usuário, página protegida
@router.get("/dashboard", response_class=HTMLResponse)
def dashboard(request:Request):
    token = request.cookies.get("token")
    
    if not token or not verificar_token(token):
        return RedirectResponse(url="/", status_code=303)
    else:
        return templates.TemplateResponse("dashboard.html", {"request":request})
    
# ---------- Carrinho ----------

# carrinho simples em memória
carrinhos = {}

# adicionar item ao carrinho
@router.post("/carrinho/adicionar/{produto_id}")
async def adicionar_carrinho(request:Request, produto_id:int, quantidade:int=Form(1), db:Session=Depends(get_db)):
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not payload:
        return RedirectResponse(url="/login", status_code=303)
    email = payload.get("sub")
    clientes = db.query(Clientes).filter_by(email=email).first()
    produto = db.query(Produtos).filter_by(id = produto_id).first()
    if not produto:
        return {"mensagem":"Produto não encontrado"}
    carrinho = carrinhos.get(clientes.id_cliente,[])
    carrinho.append({
        "id":produto.id,
        "nome":produto.nome,
        "preco":produto.preco,
        "quantidade":quantidade
    })
    carrinhos[clientes.id_cliente] = carrinho
    return RedirectResponse(url="/carrinho", status_code=303)

# ver o carrinho
@router.get("/carrinho",response_class=HTMLResponse)
def ver_carrinho(request:Request,db:Session=Depends(get_db)):
    token=request.cookies.get("token")
    payload=verificar_token(token)
    if not payload:
        return RedirectResponse(url="/login",status_code=303)
    email=payload.get("sub")
    clientes=db.query(Clientes).filter_by(email=email).first()
    carrinho=carrinhos.get(Clientes.id,[])
    total=sum(item["preco"]*item["quantidade"] for item in carrinho)
    return templates.TemplateResponse("carrinho.html",{
        "request":request,"carrinho":carrinho,"total":total
    })

# finalizar compra chechout
@router.post("/chechout")
def checkout(request:Request,db:Session=Depends(get_db)):
    token=request.cookies.get("token")
    payload=verificar_token(token)
    if not payload:
        return RedirectResponse(url="/login",status_code=303)
    email=payload.get("sub")
    cliente=db.query(Clientes).filter_by(email=email).first()
    carrinho=carrinhos.get(cliente.id,[])
    if not carrinho:
        return {"mensagem":"Carrinho vazio"}
    total=sum(item["preco"]*item["quantidade"] for item in carrinho)
    pedido = Pedidos(cliente_id=cliente.id,total=total)
    db.add(pedido)
    db.commit()
    db.refresh(pedido)

"""    #novo item ao carrinho
    for item in carrinho:
        novo_item=ItemPedido(
            pedido_id=pedido.id,
            produto_id=item["id"],
            quantidade=item["quantidade"],
            preco_unitario=item["preco"]
        )
        db.add(novo_item)
    db.commit()
    #limpar o carrinho
    carrinhos[usuario.id]=[]
    return RedirectResponse(url="/meus-pedidos",
                            status_code=303)

#listar pedidos do usuário
@router.get("/meus-pedidos",response_class=HTMLResponse)
def meus_pedidos(request:Request,db:Session=Depends(get_db)):
    token=request.cookies.get("token")
    payload=verificar_token(token)
    if not payload:
        return RedirectResponse(url="/login",status_code=303)
    email=payload.get("sub")
    usuario=db.query(Usuario).filter_by(email=email).first()
    pedidos=db.query(Pedido).filter_by(usuario_id=usuario.id).all()
    return templates.TemplateResponse("meus_pedidos.html",
            {"request":request,"pedidos":pedidos})"""