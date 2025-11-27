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
