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
router.mount("/static/upload/img", StaticFiles(directory="static/upload/img"), name="static")

# carrinho simples em memória
carrinhos = {}

UPLOAD_DIR = '../static/upload/img'
# caminho para o os
os.makedirs(UPLOAD_DIR, exist_ok=True)

def _salvar_upload_file(upload_file: UploadFile):
    """Função auxiliar para salvar um UploadFile no UPLOAD_DIR e retornar o nome do arquivo."""
    if upload_file and upload_file.filename:
        caminho_arquivo = os.path.join(UPLOAD_DIR, upload_file.filename)
        with open(caminho_arquivo, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        return upload_file.filename
    return None

#------------------------------AÇÕES DE UM ADMIN-------------------------------------------
#------------------------------FOI ATUALIZADO SÓ AS FUNÇÕES DESTE BLOCO--------------------

#Rota admin crud nos produtos
@router.get("/admin", response_class=HTMLResponse, name="admin")
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
    # Salva cada imagem e obtém seu nome de arquivo
    nome_imagem = _salvar_upload_file(imagem)
    nome_imagem1 = _salvar_upload_file(imagem1)
    nome_imagem2 = _salvar_upload_file(imagem2)
    nome_imagem3 = _salvar_upload_file(imagem3)
    
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
    
    # Atualiza os campos do produto
    produto.nome = nome
    produto.descricao = descricao
    # produto.categoria = categoria # O campo categoria não existe no modelo Produtos
    produto.cor = cor
    produto.preco = preco
    produto.tamanho = tamanho
    produto.estoque = estoque
    
    # Atualiza as imagens se novos arquivos forem enviados
    if nome_imagem := _salvar_upload_file(imagem):
        produto.imagem_caminho = nome_imagem
    if nome_imagem1 := _salvar_upload_file(imagem1):
        produto.imagem_caminho1 = nome_imagem1
    if nome_imagem2 := _salvar_upload_file(imagem2):
        produto.imagem_caminho2 = nome_imagem2
    if nome_imagem3 := _salvar_upload_file(imagem3):
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