#criar a tabela do banco de dados
from database import Base
from sqlalchemy import Column,Integer,String,Float,DateTime,ForeignKey
from sqlalchemy.orm import relationship

class Carrinho(Base):
    __tablename__ = 'carrinho'

    id_carrinho = Column(Integer, primary_key=True,index=True)
    id_cliente = Column(Integer, ForeignKey('clientes.id_cliente'), nullable=False,index=True)  # Chave estrangeira /NÃO SEI SE TA FUNCIONANDO
    id_produto = Column(Integer, ForeignKey('produtos.id_produto'), nullable=False,index=True)  # Chave estrangeira /NÃO SEI SE TA FUNCIONANDO
    valor_unitario = Column(Float,index=True)

    # Relacionamento de volta para o Cliente
    cliente = relationship('clientes', back_populates='carrinho')
    produto = relationship('produtos', back_populates='carrinho')

# Base.metadata.create_all(bind=engine)
