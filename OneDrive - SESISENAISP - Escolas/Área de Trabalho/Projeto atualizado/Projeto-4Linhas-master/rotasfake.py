from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title = "Rotas fake API")


produtos = {
    1: {"nome": "Camisa Barcelona 2025", "descricao": "patch bordado", "preco": 450, "estoque": 5, "data": "17/09/25"},
    2: {"nome": "Camisa Brasil Seleção 2022", "descricao": "design verde e amarelo", "preco": 500, "estoque": 10, "data": "18/09/25"},
    3: {"nome": "Camisa Real Madrid 24/25", "descricao": "modelo temporada 2024/2025", "preco": 550, "estoque": 7, "data": "23/09/25"},
}

@app.get("/produto")
def exibir_produtos():
    return produtos

@app.get("/get-produtos/{id_produto}")
async def id_produtos(id_produto: int):
    return produtos[id_produto]
    
@app.get("/get-produto-nome")
async def puxar_nome(nome:str):
    for produto in produtos:
        if produtos[produto]["nome"] == nome:
            return produtos[produto]
    return{"Erro":"Camisa não encontrada"}

# manipulação com bando de dados usando pydantic
class Item(BaseModel):
    nome: str
    descricao: str
    preco: int
    estoque: int
    data: str

@app.post("/items/")
async def criar_produto(item: Item):
    novo_produto = len(produtos) +1
    produtos[novo_produto] = {
        "nome": item.nome,
        "descricao": item.descricao,
        "preco": item.preco,
        "estoque": item.estoque,
        "data": item.data
    }
    return produtos[novo_produto]

@app.put("/items-update/{item_id}")
async def atualizar_produto(item_id:int, item:Item):
    if item_id in produtos:
        produtos[item_id] = {
            "nome": item.nome,
            "descricao": item.descricao,
            "preco": item.preco,
            "estoque": item.estoque,
            "data": item.data
        }
        return{"Produto":produtos[item_id]}

@app.delete("/items-delete/{item_id}")
async def deletar_produto(id_produto: int):
    if id_produto in produtos:
        deletado = produtos.pop(id_produto)
        return{"Produto":deletado}
    else:
        return{"Erro":"Produto não encontrado"}