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


# Rota para listar endereços do usuário autenticado (JSON)
@router.get("/api/enderecos")
def listar_enderecos(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not payload:
        return JSONResponse({"success": False, "message": "Usuário não autenticado"}, status_code=401)

    email = payload.get("sub")
    cliente = db.query(Clientes).filter_by(email=email).first()
    if not cliente:
        return JSONResponse({"success": False, "message": "Cliente não encontrado"}, status_code=404)

    enderecos = db.query(Endereco).filter_by(id_cliente=cliente.id_cliente).all()
    print(f"[DEBUG] listar_enderecos: encontrado {len(enderecos)} enderecos para cliente {cliente.id_cliente}")
    result = []
    for e in enderecos:
        result.append({
            "id_endereco": e.id_endereco,
            "logradouro": e.logradouro,
            "numero": e.numero,
            "complemento": e.complemento,
            "bairro": e.bairro,
            "cidade": e.cidade,
            "estado": e.estado,
            "pais": e.pais,
            "cep": e.cep
        })

    return JSONResponse({"success": True, "enderecos": result})
    


@router.post("/api/enderecos/remover")
def remover_endereco(request: Request, id_endereco: int = Form(...), db: Session = Depends(get_db)):
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not payload:
        return JSONResponse({"success": False, "message": "Usuário não autenticado"}, status_code=401)

    email = payload.get("sub")
    cliente = db.query(Clientes).filter_by(email=email).first()
    if not cliente:
        return JSONResponse({"success": False, "message": "Cliente não encontrado"}, status_code=404)

    endereco_obj = db.query(Endereco).filter_by(id_endereco=id_endereco, id_cliente=cliente.id_cliente).first()
    if not endereco_obj:
        return JSONResponse({"success": False, "message": "Endereço não encontrado"}, status_code=404)

    db.delete(endereco_obj)
    db.commit()
    return JSONResponse({"success": True, "message": "Endereço removido"})



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
        # Retorna JSON com status 200 para que o frontend capture o erro
        return JSONResponse(
            {"mensagem": "Credenciais inválidas"},
            status_code=200
        )
    
    token = criar_token({"sub": cliente.email,
    "is_admin":cliente.is_admin})

    # Determina o destino baseado no tipo de usuário
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


# OBSERVAÇÃO / HISTÓRICO (importante):
# Problema descoberto: o modal de endereço no front-end não estava
# disparando um POST persistente para o backend — havia duas causas
# principais durante o desenvolvimento:
#  1) O endpoint originalmente exigia um campo `pais` que não existe
#     no formulário do modal; isso causava validações/erros e dificultou
#     o diagnóstico. Ajustamos a assinatura para `pais: str = Form("Brasil")`
#     (valor padrão) para que o endpoint aceite o que o modal envia.
#  2) Havia uma duplicação/noverride do `window.salvarEndereco` no JS
#     (uma versão síncrona em memória sobrescrevia a versão assíncrona
#     que faz o `fetch`). Isso fez parecer que "nada acontecia" ao
#     clicar em salvar. Removemos a versão não-AJAX no frontend para garantir
#     que o POST seja enviado.
# Mudanças aplicadas aqui no backend:
#  - `/salvar_endereco` agora retorna respostas JSON (sucesso/erro)
#  - aceita `id_endereco` para update/create
#  - `pais` tem valor padrão "Brasil" para corresponder ao modal
#  - prints de debug foram adicionados temporariamente para inspecionar
#    os dados recebidos e o número de endereços retornados (remover depois)
# TODO: remover prints de debug quando o fluxo estiver estável.
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
    pais: str = Form("Brasil"),
    cep: str = Form(...),
    id_endereco: int = Form(None),
    db: Session = Depends(get_db)
):
    # Verifica token de autenticação
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not payload:
        return JSONResponse({"success": False, "message": "Usuário não autenticado"}, status_code=401)

    email = payload.get("sub")
    cliente = db.query(Clientes).filter_by(email=email).first()

    if not cliente:
        return {"erro": "Cliente não encontrado"}

    # Cria um novo endereço vinculado ao cliente
    #DADOS PEGOS DO BANCO E ATUALIZADOS - DIA 13/11/2025
    try:
        # If id_endereco provided, update existing record
        if id_endereco:
            endereco_obj = db.query(Endereco).filter_by(id_endereco=id_endereco, id_cliente=cliente.id_cliente).first()
            if not endereco_obj:
                return JSONResponse({"success": False, "message": "Endereço não encontrado"}, status_code=404)
            endereco_obj.logradouro = logradouro
            endereco_obj.numero = numero
            endereco_obj.complemento = complemento
            endereco_obj.bairro = bairro
            endereco_obj.cidade = cidade
            endereco_obj.estado = uf
            endereco_obj.pais = pais
            endereco_obj.cep = cep
            db.add(endereco_obj)
            db.commit()
            db.refresh(endereco_obj)
            return JSONResponse({"success": True, "endereco": {
                "id_endereco": endereco_obj.id_endereco,
                "logradouro": endereco_obj.logradouro,
                "numero": endereco_obj.numero,
                "complemento": endereco_obj.complemento,
                "bairro": endereco_obj.bairro,
                "cidade": endereco_obj.cidade,
                "estado": endereco_obj.estado,
                "pais": endereco_obj.pais,
                "cep": endereco_obj.cep
            }})
        # debug: print received fields
        print(f"[DEBUG] salvar_endereco: recebido logradouro={logradouro!r}, numero={numero!r}, complemento={complemento!r}, bairro={bairro!r}, cidade={cidade!r}, uf={uf!r}, pais={pais!r}, cep={cep!r}, id_endereco={id_endereco!r}")

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
        db.refresh(novo_endereco)
        return JSONResponse({"success": True, "endereco": {
            "id_endereco": novo_endereco.id_endereco,
            "logradouro": novo_endereco.logradouro,
            "numero": novo_endereco.numero,
            "complemento": novo_endereco.complemento,
            "bairro": novo_endereco.bairro,
            "cidade": novo_endereco.cidade,
            "estado": novo_endereco.estado,
            "pais": novo_endereco.pais,
            "cep": novo_endereco.cep
        }})
    except Exception as e:
        # log the exception to server console
        import traceback
        print('Erro ao salvar endereço:', str(e))
        print(traceback.format_exc())
        return JSONResponse({"success": False, "message": "Erro interno ao salvar endereço"}, status_code=500)
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


# ---------- ROTAS DE FAVORITOS (ADICIONADO/MODIFICADO PELO GEMINI) ----------

# ROTA DE API PARA ADICIONAR/REMOVER UM FAVORITO
@router.post("/api/favoritos/toggle", name="toggle_favorito")
async def toggle_favorito(request: Request, db: Session = Depends(get_db)):
    """
    Adiciona ou remove um produto da lista de favoritos do usuário.
    Esta rota é chamada via JavaScript (Fetch API).
    """
    print("----- Início da requisição /api/favoritos/toggle -----")
    token = request.cookies.get("token")
    print(f"Token recebido: {token is not None}")
    payload = verificar_token(token)
    if not payload:
        print("Erro: Payload do token inválido ou token ausente.")
        return JSONResponse({'status': 'error', 'message': 'Login necessário.'}, status_code=401)

    user = get_user_from_token(request, db)
    if not user:
        print("Erro: Usuário não encontrado após verificação do token.")
        return JSONResponse({'status': 'error', 'message': 'Usuário não encontrado.'}, status_code=404)
    print(f"Usuário autenticado: {user.id_cliente}")

    try:
        data = await request.json()
        product_id = data.get('product_id')
        print(f"product_id recebido: {product_id}, Tipo: {type(product_id)}")
        if not product_id:
            print("Erro: ID do produto não fornecido no corpo da requisição.")
            return JSONResponse({'status': 'error', 'message': 'ID do produto não fornecido.'}, status_code=400)
    except Exception as e:
        print(f"Erro ao parsear JSON da requisição: {e}")
        return JSONResponse({'status': 'error', 'message': 'Dados inválidos.'}, status_code=400)


    # Verifica se o produto existe
    produto = db.query(Produtos).get(product_id)
    if not produto:
        print(f"Erro: Produto com ID {product_id} não encontrado no banco de dados.")
        return JSONResponse({'status': 'error', 'message': 'Produto não encontrado.'}, status_code=404)
    print(f"Produto encontrado: {produto.nome} (ID: {produto.id_produto})")

    # Verifica se o item já é um favorito do usuário atual
    favorito_existente = db.query(Favoritos).filter_by(
        cliente_id=user.id_cliente,
        produto_id=product_id
    ).first()
    print(f"Favorito existente para (Cliente {user.id_cliente}, Produto {product_id}): {favorito_existente is not None}")

    try:
        if favorito_existente:
            # Se já existe, remove
            db.delete(favorito_existente)
            db.commit()
            print("Sucesso: Produto removido dos favoritos.")
            return JSONResponse({'status': 'removed', 'message': 'Produto removido dos favoritos.'})
        else:
            # Se não existe, adiciona
            novo_favorito = Favoritos(cliente_id=user.id_cliente, produto_id=product_id)
            db.add(novo_favorito)
            db.commit()
            print("Sucesso: Produto adicionado aos favoritos.")
            return JSONResponse({'status': 'added', 'message': 'Produto adicionado aos favoritos.'})

    except Exception as e:
        db.rollback()
        import traceback
        print(f"Erro no banco de dados durante operação de favorito: {e}")
        print(traceback.format_exc())
        return JSONResponse({'status': 'error', 'message': 'Erro ao processar a solicitação.'}), 500


# ROTA PARA A PÁGINA DE FAVORITOS
@router.get("/favoritos", response_class=HTMLResponse, name="favoritos")
async def pagina_favoritos(request:Request, db: Session = Depends(get_db)):
    """
    Busca os produtos favoritados pelo usuário logado e renderiza a página de favoritos.
    """
    context = get_base_context(request, db)
    user = context.get("user")

    if not user:
        return RedirectResponse(url="/login", status_code=303)

    # Busca os produtos favoritos do usuário através da relação
    # Acessa o objeto 'produto' de cada item 'favorito'
    produtos_favoritos = [fav.produto for fav in user.favoritos]

    context.update({"favoritos_list": produtos_favoritos})
    return templates.TemplateResponse("pages/favoritos/favoritos.html", context)


# Rota sobre
@router.get("/sobre", response_class=HTMLResponse, name="sobre")
async def pagina_sobre(request:Request, db: Session = Depends(get_db)):
    context = get_base_context(request, db)
    return templates.TemplateResponse("pages/sobre/sobre.html", context)
