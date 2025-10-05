from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from models import *

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
@router.get("/api/produto/{id_produto}")
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
