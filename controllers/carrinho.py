import requests
from fastapi import APIRouter, Request, Form, UploadFile, File, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import os, shutil
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from models.models import *
from models.models import Clientes, Produtos, Pedidos , ItemPedido
from auth import *
from controllers.enviar_email import send_order_email

router = APIRouter() # rotas
templates = Jinja2Templates(directory="templates") # front-end

# Configuração dos arquivos estáticos
router.mount("/static", StaticFiles(directory="static"), name="static")

# carrinho simples em memória
carrinhos = {}

UPLOAD_DIR = '../static/upload/img'
# caminho para o os
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------- Carrinho ----------

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

# Import para usar 
from controllers.cliente import *

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

def _get_cart_data(carrinho: list) -> dict:
    """Calcula o total e a quantidade de itens do carrinho."""
    total = sum(item["preco"] * item["quantidade"] for item in carrinho)
    quantidade_total = sum(item["quantidade"] for item in carrinho)
    return {"total": total, "quantidade_total": quantidade_total, "itens": carrinho}

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
        return JSONResponse({"success": False, "message": "Não autenticado"}, status_code=401)
    
    email = payload.get("sub")
    cliente = db.query(Clientes).filter_by(email=email).first()
    if not cliente:
        return JSONResponse({"success": False, "message": "Cliente não encontrado"}, status_code=401)

    carrinho = carrinhos.get(cliente.id_cliente, [])
    
    produto_encontrado = False
    for item in carrinho:
        if item["id"] == produto_id:
            if quantidade > 0:
                item["quantidade"] = quantidade
            else:
                # Se a quantidade for 0 ou menos, remove o item
                carrinho.remove(item)
            produto_encontrado = True
            break
            
    if not produto_encontrado:
        return JSONResponse({"success": False, "message": "Produto não encontrado no carrinho"}, status_code=404)

    carrinhos[cliente.id_cliente] = carrinho
    cart_data = _get_cart_data(carrinho)
    
    return JSONResponse({
        "success": True, 
        "message": "Quantidade atualizada",
        "cart": cart_data
    })

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
        return JSONResponse({"success": False, "message": "Não autenticado"}, status_code=401)
    
    email = payload.get("sub")
    cliente = db.query(Clientes).filter_by(email=email).first()
    if not cliente:
        return JSONResponse({"success": False, "message": "Cliente não encontrado"}, status_code=401)

    carrinho = carrinhos.get(cliente.id_cliente, [])
    
    initial_len = len(carrinho)
    carrinho = [item for item in carrinho if item["id"] != produto_id]
    
    if len(carrinho) == initial_len:
        return JSONResponse({"success": False, "message": "Produto não encontrado no carrinho"}, status_code=404)

    carrinhos[cliente.id_cliente] = carrinho
    cart_data = _get_cart_data(carrinho)

    return JSONResponse({
        "success": True,
        "message": "Produto removido do carrinho",
        "cart": cart_data
    })

#rota checkout
@router.post("/checkout")
async def checkout(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
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
            "erro": "Carrinho vazio",
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

    # Preparar itens para enviar no email
    itens_email = [
        {
            "nome": item["nome"],
            "quantidade": item["quantidade"],
            "preco": item["preco"]
        }
        for item in carrinho
]

    # Enviar email em segundo plano
    background_tasks.add_task(send_order_email, cliente.email, pedido, itens_email)

    db.commit()

    carrinhos[cliente.id_cliente] = []

    # -----------------------------------------------
    # ---- ENVIAR EMAIL DE CONFIRMAÇÃO DE COMPRA ----
    # -----------------------------------------------

    itens_email = [
        {
            "nome": item["nome"],
            "quantidade": item["quantidade"],
            "preco": item["preco"]
        }
        for item in carrinho
    ]

    background_tasks.add_task(send_order_email, cliente.email, pedido, itens_email)


    # Redireciona para página de confirmação com id do pedido
    return RedirectResponse(url=f"/pedidos/confirmacao?id={pedido.id_pedido}", status_code=303)