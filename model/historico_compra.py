from sqlalchemy import Column, Integer, ForeignKey, DECIMAL, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import datetime

# Base para definir as tabelas
Base = declarative_base()

class HistoricoCompra(Base):
    __tablename__ = 'historico_compras'

    id_historico = Column(Integer, primary_key=True, autoincrement=True)  # Chave primária
    id_cliente = Column(Integer, ForeignKey('clientes.id_cliente'), nullable=False)  # Chave estrangeira para Clientes/NÃO SEI SE TA FUNCIONANDO
    id_pedido = Column(Integer, ForeignKey('pedidos.id_pedido'), nullable=False)  # Chave estrangeira para Pedidos/NÃO SEI SE TA FUNCIONANDO
    id_produto = Column(Integer, ForeignKey('produtos.id_produto'), nullable=False)  # Chave estrangeira para Produtos/NÃO SEI SE TA FUNCIONANDO
    quantidade = Column(Integer, nullable=False)  # Quantidade do produto comprado
    preco_unitario = Column(DECIMAL(10, 2), nullable=False)  # Preço unitário do produto
    data_compra = Column(DateTime, default=datetime.datetime.utcnow)  # Data da compra, com valor padrão sendo a data atual em UTC

    # Relacionamentos (opcionais, para acessar facilmente os dados relacionados)
    cliente = relationship("clientes", back_populates="historico_compras")
    pedido = relationship("pedidos", back_populates="historico_compras")
    produto = relationship("produtos", back_populates="historico_compras")