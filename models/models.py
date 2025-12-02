from sqlalchemy import Column, Integer, String, Float, DECIMAL, Boolean, ForeignKey, UniqueConstraint
from database import Base, engine, SessionLocal
from sqlalchemy.orm import relationship
from auth import *
from sqlalchemy import ForeignKey, text

# tabela clientes
class Clientes(Base):
    __tablename__='clientes'
    id_cliente = Column(Integer,primary_key=True, index=True)
    nome = Column(String(50))
    cpf = Column(String(14),unique=True,nullable=False)
    email = Column(String(100), unique=True)
    senha = Column(String(200))
    telefone = Column(String(50),nullable=False)
    endereco = Column(String(100), nullable=False)
    pedidos=relationship("Pedidos",back_populates="clientes")
    favoritos = relationship("Favoritos", back_populates="cliente", cascade="all, delete-orphan")
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
class Pedidos(Base):
    __tablename__ = 'pedidos'
    id_pedido = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"))
    endereco_entrega = Column(String)
    cep_entrega = Column(String)
    valor_frete = Column(Float, nullable=False)
    data_pedido = Column(String, nullable=False)
    status = Column(String, nullable=False)
    valor_total = Column(Float, nullable=False)
    clientes = relationship("Clientes", back_populates="pedidos")
    itens = relationship("ItemPedido", back_populates="pedidos", cascade="all, delete-orphan")


class ItemPedido(Base):
    __tablename__="itens_pedido"
    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id_pedido"))
    produto_id = Column(Integer, ForeignKey("produtos.id_produto"))
    quantidade = Column(Integer)
    preco_unitario = Column(Float)

    pedidos = relationship("Pedidos", back_populates="itens")
    # Alteração feita pelo Gemini: Adiciona a relação com a tabela Produtos.
    # Isso permite acessar os detalhes do produto (nome, imagem, etc.) diretamente a partir de um item do pedido (ex: item.produto.nome).
    # O 'lazy="joined"' otimiza a consulta, trazendo os dados do produto junto com os do item, evitando consultas extras ao banco.
    produto = relationship("Produtos", lazy="joined")

class Endereco(Base): #esperando o bda criar a tabela
    __tablename__="enderecos_clientes"
    id_endereco = Column(Integer,primary_key=True,index=True)
    id_cliente = Column(Integer,ForeignKey("clientes.id_cliente"))
    logradouro = Column(String, nullable=True)
    numero = Column(String, nullable=True)
    complemento = Column(String, nullable=True)
    bairro = Column(String, nullable=True)
    cidade = Column(String, nullable=True)
    estado = Column(String, nullable=True)
    pais = Column(String, nullable=True)
    cep = Column(String, nullable=True)


class Favoritos(Base):
    __tablename__ = 'favoritos'
    id_favorito = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey('clientes.id_cliente'), nullable=False)
    produto_id = Column(Integer, ForeignKey('produtos.id_produto'), nullable=False)
    valor_produto = Column(DECIMAL(10,2), nullable=True)

    cliente = relationship("Clientes", back_populates="favoritos")
    produto = relationship("Produtos", lazy="joined")

    __table_args__ = (
        UniqueConstraint('cliente_id', 'produto_id', name='_cliente_produto_uc'),
    )

class Cupom(Base):
    __tablename__ = "cupons"
    id_cupon = Column(Integer,primary_key=True,index=True)
    chave_cupon = Column(String, nullable=True)
    valor_desconto = Column(Float, nullable=True)
    ativo = Column(Boolean,default=True)


#Base.metadata.create_all(bind=engine)
