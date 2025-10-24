from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWSError, jwt
from passlib import *

pwd_context = CryptContext(schemes=['bcrypt'], deprecated = 'auto')

def gerar_senha(senha:str):
    return pwd_context.hash(senha)

SECRET_KEY = "chave_secreta"
ALGORITHM = "HS256"
ACCESS_TOKEN = 30

def verificar_hash_senha(senha:str, senha_hash:str):
    return pwd_context.verify(senha, senha_hash)

#criar token de usuário
def criar_token(dados:dict):
    dados_token = dados.copy()
    expira = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN)
    dados_token.update({'exp':expira})
    token_jwt = jwt.encode(dados_token,SECRET_KEY, algorithm=ALGORITHM)
    return token_jwt

#verificar token do usuário
def verificar_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWSError:
        return None