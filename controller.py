from fastapi import APIRouter, Request, Form, UploadFile, File, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from models import *
from database import get_db
from sqlalchemy.orm import Session
from models import Produtos, Usuario
from auth import gerar_senha, verificar_hash_senha, criar_token, verificar_token

router = APIRouter()
templates = Jinja2Templates(directory="templates")

@router.get("/", response_class=HTMLResponse)
async def index(request:Request):
    produtos = listar_produtos()
    return templates.TemplateResponse("index.html", {"request": request,"produtos": produtos})

# rota produtos template
# seu merda, quando o usuario digitar o endereço: /produto/{id_produto} voce rodar o seguinte comando:
@router.get("/produto/{id_produto}", response_class=HTMLResponse)
async def detalhe_produto(request: Request, id_produto: int):
    produto = id_produtos(id_produto)
    if not produto:
        return templates.TemplateResponse("erro.html", {
            "request": request,
            "mensagem": "Produto não encontrado"
        })
    return templates.TemplateResponse("produto.html", {
        "request": request,
        "produto": produto
    })

# rota para listar produtos
@router.get("/api/produtos")
async def api_listar_produtos():
    return listar_produtos()

# rota id produto
@router.get("/produto/{id_produto}")
async def api_produto_id(id_produto: int):
    return id_produtos(id_produto)

# produto pelo nome
@router.get("/api/produto/nome/{nome}")
async def api_produto_nome(nome: str):
    return puxar_nome(nome)

# puxar produto pelo tamnho
@router.get("/api/produto/tamanho/{tamanho}")
async def api_produto_tamanho(tamanho: str):
    return puxar_tamanho(tamanho)
# preco
@router.get("/api/produto/preco/{preco}")
async def api_produto_preco(preco: float):
    return obter_produto_por_preco(preco)


# cadastro de usuário
@router.get("/register", response_class=HTMLResponse)
def pagina_cadastro(request:Request):
    return templates.TemplateResponse("register.html", {
        "request":request
    })

# formulário para criar usuário
@router.post("/register")
def cadastrar_usuario(request:Request,
    nome:str = Form(...), email:str = Form(...),
    senha:str = Form(...), db:Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if usuario:
        return {"mensagem":"E-mail já cadastrado!"}
    senha_hash = gerar_senha(senha)
    novo_usuario = Usuario(nome=nome, email=email, senha=senha_hash)
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return RedirectResponse(url="/", status_code=303)

# rota de login
@router.get("/login", response_class=HTMLResponse)
def home(request:Request):
    return templates.TemplateResponse("login.html",{"request":request})

# post login do usuário
@router.post("/login")
def login(request: Request, email: str = Form(...),
        senha:str=Form(...), db:Session=Depends(get_db)):
    
    usuario = db.query(Usuario).filter(Usuario.email==email).first()
    if not usuario or not verificar_hash_senha(senha, usuario.senha):
        return templates.TemplateResponse("login.html", {
            "request": request,
            "mensagem": "Credenciais"
        })
    
    token = criar_token({"sub":usuario.email})
    response = RedirectResponse(url="/dashboard", status_code=303)
    response.set_cookie(key="token", value=token, httponly=True)
    return response

# criar roya do dashboard do usuário, página protegida
@router.get("/dashboard", response_class=HTMLResponse)
def dashboard(request:Request):
    token = request.cookies.get("token")
    
    if not token or verificar_token(token):
        return RecursionError(url="/login", status_code=303)
    return templates.TemplateResponse("dashboard.html", {"request":request})