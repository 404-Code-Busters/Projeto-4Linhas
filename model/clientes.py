# criar a tabela do banco de dados
from database import Base
from sqlalchemy import Column,Integer,String,Date

class Clientes(Base):
    __tablename__ = "Clientes"
    id_clientes = Column(Integer,primary_key=True,index=True)
    nome = Column(String,index=True)
    email = Column(String,index=True)
    telefone = Column(String,index=True)
    data_cadastro = Column(Date,index=True) #TA FUNCIONANDO

# Base.metadata.create_all(bind=engine)
