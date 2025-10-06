# criar a tabela do banco de dados
from database import Base
from sqlalchemy import Column,Integer,String,Float,DateTime
import datetime

class Produtos(Base):
    __tablename__ = "Produtos"
    id_produto = Column(Integer,primary_key=True,autoincrement=True,index=True)
    nome = Column(String,index=True)
    descricao = Column(String,index=True)
    preco = Column(Float,index=True)
    estoque = Column(Integer,index=True)
    data_cadastro = Column(DateTime, default=datetime.datetime.utcnow)

# Base.metadata.create_all(bind=engine)
