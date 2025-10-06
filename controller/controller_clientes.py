from fastapi import FastAPI#construir api
from pydantic import BaseModel#POST
from typing import Optional#PUT
from model.clientes import Clientes

import pymysql

con= pymysql.connect(
    user="root",#usuario do banco
    password="dev1t@24",#senha do banco de dados
    host = "localhost",
    port = 3306,#caminho da rede 
    database="ecommerce_esportes",
)

cur = con.cursor()

app = FastAPI(title="API Clientes MariaDB")
#dados clientes
class Clientes(BaseModel):
    nome:str
    email:str
    telefone:str
#atualizar clientes
class AtualizarCliente(BaseModel):
    nome:Optional[str] = None
    email:Optional[str] = None
    telefone:Optional[str] = None

#endpoints GET,POST,PUT,DELETE
#listar todos os clientes"
@app.get("/clientes")
async def listar_clientes():
    cur.execute("SELECT * FROM clientes")
    dados = cur.fetchall()#trazer os dados do banco
    return [{"id":id,"nome":nome,"email":email,"telefone":telefone,"Data de cadastro:":data_cadastro}
            for id,nome,email,telefone,data_cadastro in dados]

#cadastrar um cliente
@app.post("/cadastrar-cliente/{cliente_id}")
async def cadastrar_cliente(cliente_id:int,cliente:Clientes):
    #verificar se já existe o ID
    cur.execute("SELECT * FROM clientes WHERE id_cliente=%s",(cliente_id,))
    if cur.fetchone():
        return{"ERRO":"ID já existe"}
    #criar o Clientes
    cur.execute("""INSERT INTO clientes (id_cliente,nome,email,telefone) VALUES (%s,%s,%s,%s)""",
                (cliente_id,cliente.nome,cliente.email,cliente.telefone))
    con.commit()
    return {"MENSAGEM":"Cliente cadastrado com sucesso!"}
#atualizar o cliente pelo id
@app.put("/atualizar-cliente/{cliente_id}")
async def atualizar_cliente(cliente_id:int,cliente:AtualizarCliente):
    cur.execute("SELECT * FROM clientes WHERE id_cliente=%s",
                (cliente_id,))
    if not cur.fetchone():#id do cliente não encontrado 
        return{"ERRO":"Cliente não existe."}
    #se o cliente existir, ele é atualizado
    if cliente.nome:
        cur.execute("UPDATE clientes SET nome=%s WHERE id_cliente=%s",
                    (cliente.nome,cliente_id))
    if cliente.email:
        cur.execute("UPDATE clientes SET email=%s WHERE id_cliente=%s",
                    (cliente.email,cliente_id))
    if cliente.telefone:
        cur.execute("UPDATE clientes SET telefone=%s WHERE id_cliente=%s",
                    (cliente.telefone,cliente_id))
    con.commit()
    return {"mensagem":"Cliente atualizado"}

#deletar cliente pelo id
@app.delete("/deletar-cliente/{cliente_id}")
async def deletar_cliente(cliente_id:int):
    cur.execute("SELECT * FROM clientes WHERE id_cliente=%s",
                (cliente_id,))
    if not cur.fetchone():#id não encontrado do cliente
        return{"ERRO":"Cliente não existe."}
    cur.execute("DELETE FROM clientes WHERE id_cliente=%s",
                (cliente_id,))
    con.commit()
    return {"mensagem":"Cliente excluído"}