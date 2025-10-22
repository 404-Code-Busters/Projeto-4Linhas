from sqlalchemy import Column, Integer, String, Float
from database import Base, engine, SessionLocal
from sqlalchemy.orm import relationship
from auth import *
from sqlalchemy import ForeignKey, text

# tabela clientes
class Clientes(Base):
    __tablename__='clientes'
    id_cliente = Column(Integer,primary_key=True, index=True)
    nome = Column(String(50))
    email = Column(String(100), unique=True)
    senha = Column(String(200))

# tabela produtos
class Produtos(Base):
    __tablename__ = 'produtos'
    id_produto = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    descricao = Column(String, nullable=False)
    categoria = Column(String, nullable=False)
    preco = Column(Float, nullable=False)
    tamanho = Column(String, nullable=False)
    estoque = Column(Integer, nullable=False)
    data_cadastro = Column(Integer, nullable=False)

# tabela pedidos
class Pedidos(Base):
    __tablename__ = 'pedidos'
    id_pedido = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"))
    id_produto = Column(Integer, ForeignKey("produtos.id_produto"))
    data_pedido = Column(String, nullable=False)
    status = Column(String, nullable=False)
    valor_total = Column(Float, nullable=False)

#Base.metadata.create_all(bind=engine)
