from fastapi import FastAPI, APIRouter, Request, Form, UploadFile, File
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import mysql.connector

def conexao_db():
    conexao = mysql.connector.connect(
        user="root",
        password="dev1t@24",
        host="localhost",
        port=3306,
        database="ecommerce_esportes"
    )
    return conexao

# cursor = conexao.cursor()

class Produtos(BaseModel):
    nome: str
    descricao: str
    preco: float
    tamanho: str
    estoque: int
    data: str

# listar todos os produtos:--JA TA FUNCIONANDO!!
def listar_produtos():
    conexao = conexao_db()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT * FROM produtos;")
    dados = cursor.fetchall()
    conexao.close()
    return dados

# caso de merda
"""@app.get("/produto")
def listar_produtos():
    cursor.execute("SELECT * FROM produtos;")
    dados = cursor.fetchall()
    return dados"""

def id_produtos(id_produto:int):
    conexao = conexao_db()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT * FROM produtos WHERE id_produto = %s", (id_produto,))
    dado = cursor.fetchone()
    conexao.close()
    return dado

def puxar_nome(nome: str):
    conexao = conexao_db()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT * FROM produtos WHERE nome = %s", (nome,))
    dado = cursor.fetchall()
    conexao.close()
    return dado

def puxar_tamanho(tamanho: str):
    conexao = conexao_db()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT * FROM produtos WHERE tamanho = %s", (tamanho,))
    dados = cursor.fetchall()
    conexao.close()
    return dados


def obter_produto_por_preco(preco: float):
    conexao = conexao_db()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT * FROM produtos WHERE preco <= %s", (preco,))
    dados = cursor.fetchall()
    conexao.close()
    return dados

"""
# manipulação com bando de dados usando pydantic
class Item(BaseModel):
    nome: str
    descricao: str
    preco: int
    estoque: int
    data: str"""

# PREÇO