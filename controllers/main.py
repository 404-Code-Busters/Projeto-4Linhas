import requests
from fastapi import APIRouter, Request, Form, UploadFile, File, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import os, shutil
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from models.models import *
from models.models import Clientes, Produtos, Pedidos
from auth import *

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
        
        # Adiciona a lista de IDs de produtos favoritos ao contexto, se o usuário estiver logado
        favoritos_ids = []
        if context.get("user"):
            favoritos_ids = [fav.produto_id for fav in context["user"].favoritos]

        # Adiciona os produtos ao contexto e renderiza
        context["produtos"] = produtos
        context["favoritos_ids"] = favoritos_ids # Adiciona os IDs dos favoritos ao contexto
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
    
    is_favorited = False
    if context.get("user"):
        # Verifica se o produto está na lista de favoritos do usuário
        is_favorited = any(fav.produto_id == produto.id_produto for fav in context["user"].favoritos)

    context["produto"] = produto
    context["is_favorited"] = is_favorited # Adiciona a informação de favorito ao contexto
    # Buscar produtos relacionados: prioriza mesma cor ou mesmo tamanho, exclui o produto atual
    try:
        related_query = db.query(Produtos).filter(Produtos.id_produto != id_produto)
        # Produtos com mesma cor ou mesmo tamanho
        related_query = related_query.filter((Produtos.cor == produto.cor) | (Produtos.tamanho == produto.tamanho))
        related_produtos = related_query.limit(6).all()
    except Exception:
        related_produtos = []

    context["related_produtos"] = related_produtos
    return templates.TemplateResponse('pages/produto/produto.html', context)