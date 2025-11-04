from sqlalchemy import Column, Integer, String, Float, DECIMAL, Boolean, ForeignKey
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
    pedidos=relationship("Pedidos",back_populates="clientes")
    is_admin = Column(Boolean,default=False)

# tabela produtos
class Produtos(Base):
    __tablename__ = 'produtos'
    id_produto = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    descricao = Column(String, nullable=True)
    preco = Column(DECIMAL(10,2), nullable=False)
    tamanho = Column(String(5), nullable=False)
    cor = Column(String(50), nullable=False)
    imagem_caminho = Column(String(255), nullable=True)
    imagem_caminho1 = Column(String(255), nullable=True)
    imagem_caminho2 = Column(String(255), nullable=True)
    imagem_caminho3 = Column(String(255), nullable=True)
    estoque = Column(Integer, nullable=False)
    data_cadastro = Column(String, nullable=True)
    

# tabela pedidos
    

# tabela pedidos
class Pedidos(Base):
    __tablename__ = 'pedidos'
    id_pedido = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"))
    id_produto = Column(Integer, ForeignKey("produtos.id_produto"))
    data_pedido = Column(String, nullable=False)
    status = Column(String, nullable=False)
    valor_total = Column(Float, nullable=False)
    clientes = relationship("Clientes",back_populates="pedidos")
    itens = relationship("ItemPedido",back_populates="pedido")

class ItemPedido(Base):
    __tablename__="itens_pedido"
    id = Column(Integer,primary_key=True,index=True)
    pedido_id = Column(Integer,ForeignKey("pedidos.id_pedido"))
    produto_id = Column(Integer,ForeignKey("produtos.id_produto"))
    quantidade = Column(Integer)
    preco_unitario = Column(Float)
    pedido = relationship("Pedidos",back_populates="itens")


#Base.metadata.create_all(bind=engine)
