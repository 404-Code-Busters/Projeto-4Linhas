#criar a tabela do banco de dados
from database import Base
from sqlalchemy import Column,Integer,String,Float,DateTime,ForeignKey
from sqlalchemy.orm import relationship

class Pedido(Base):
    __tablename__ = 'Pedidos'

    id_pedido = Column(Integer, primary_key=True,index=True)
    id_cliente = Column(Integer, ForeignKey('Clientes.id_cliente'), nullable=False,index=True)  # Chave estrangeira /NÃO SEI SE TA FUNCIONANDO
    data_pedido = Column(DateTime,index=True)
    status = Column(String,index=True)
    valor_total = Column(Float,index=True)

    # Relacionamento de volta para o Cliente
    cliente = relationship('Clientes', back_populates='Pedidos')

# Base.metadata.create_all(bind=engine)
