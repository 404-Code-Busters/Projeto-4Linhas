from sqlalchemy import Column, Integer, ForeignKey, DECIMAL, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import datetime

# Base para definir as tabelas
Base = declarative_base()

class HistoricoCompra(Base):
    __tablename__ = 'Historico_compras'

    id_historico = Column(Integer, primary_key=True, autoincrement=True)  # Chave primária
    id_cliente = Column(Integer, ForeignKey('Clientes.id_cliente'), nullable=False)  # Chave estrangeira para Clientes/NÃO SEI SE TA FUNCIONANDO
    id_pedido = Column(Integer, ForeignKey('Pedidos.id_pedido'), nullable=False)  # Chave estrangeira para Pedidos/NÃO SEI SE TA FUNCIONANDO
    id_produto = Column(Integer, ForeignKey('Produtos.id_produto'), nullable=False)  # Chave estrangeira para Produtos/NÃO SEI SE TA FUNCIONANDO
    quantidade = Column(Integer, nullable=False)  # Quantidade do produto comprado
    preco_unitario = Column(DECIMAL(10, 2), nullable=False)  # Preço unitário do produto
    data_compra = Column(DateTime, default=datetime.datetime.utcnow)  # Data da compra, com valor padrão sendo a data atual em UTC

    # Relacionamentos (opcionais, para acessar facilmente os dados relacionados)
    cliente = relationship("Clientes", back_populates="Historico_compras")
    pedido = relationship("Pedidos", back_populates="Historico_compras")
    produto = relationship("Produtos", back_populates="Historico_compras")