from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from models import *

router = APIRouter()
templates = Jinja2Templates(directory="templates")

# Home
@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    produtos = listar_produtos()
    return templates.TemplateResponse(
        "pages/home/home.html",
        {"request": request, "produtos": produtos}
    )

# Catálogo de produtos
@router.get("/produtos", response_class=HTMLResponse)
async def catalogo(request: Request):
    produtos = listar_produtos()
    return templates.TemplateResponse(
        "pages/produtos/produtos.html",
        {"request": request, "produtos": produtos}
    )

# Detalhe de um produto (HTML)
@router.get("/produto/{id_produto}", response_class=HTMLResponse)
async def detalhe_produto(request: Request, id_produto: int):
    produto = id_produtos(id_produto)
    if not produto:
        return templates.TemplateResponse(
            "erro.html",
            {"request": request, "mensagem": "Produto não encontrado"}
        )
    return templates.TemplateResponse(
        "pages/produtos/produto.html",
        {"request": request, "produto": produto}
    )

# -----------------------------
# ROTAS DE API (JSON)
# -----------------------------

@router.get("/api/produtos")
async def api_listar_produtos():
    return listar_produtos()

@router.get("/api/produto/{id_produto}")
async def api_produto_id(id_produto: int):
    return id_produtos(id_produto)

@router.get("/api/produto/nome/{nome}")
async def api_produto_nome(nome: str):
    return puxar_nome(nome)

@router.get("/api/produto/tamanho/{tamanho}")
async def api_produto_tamanho(tamanho: str):
    return puxar_tamanho(tamanho)

@router.get("/api/produto/preco/{preco}")
async def api_produto_preco(preco: float):
    return obter_produto_por_preco(preco)
