from database import Base,engine
from sqlalchemy import Column,Integer,String,Float,DateTime,ForeignKey
from sqlalchemy.orm import relationship

class Pedido(Base):
    __tablename__ = 'Pagamentos'

    id_pagamento = Column(Integer, primary_key=True,index=True)
    id_pedido = Column(Integer, ForeignKey('Pedidos.id_pedido'), nullable=False,index=True)  # Chave estrangeira /NÃO SEI SE TA FUNCIONANDO
    metodo_pagamento = Column(String,index=True)
    valor = Column(Float,index=True)
    status_pagamento = Column(String,index=True)
    data_pagamento = Column(DateTime,index=True)
    # Relacionamento de volta para o Cliente
    pedidos = relationship('Pagamentos', back_populates='Pedidos')

# Base.metadata.create_all(bind=engine)
