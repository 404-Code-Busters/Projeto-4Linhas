#criar banco de dados
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column,Integer,String,Float,DateTime

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
Base = declarative_base()

#criar a tabela do banco de dados/ Tava dando BO colocar fora daqui, então deixei tudo junto
# class Produtos(Base):
#     __tablename__ = "Produtos"
#     id_produto = Column(Integer,primary_key=True,autoincrement=True,index=True)
#     nome = Column(String,index=True)
#     descricao = Column(String,index=True)
#     preco = Column(Float,index=True)
#     estoque = Column(Integer,index=True)
#     data_cadastro = Column(DateTime, default=datetime.datetime.utcnow)

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


engine = create_engine('mysql+pymysql://dev_a:dev1t#24@localhost:3306/ecommerce_esportes')#Acesso ao banco de dados
SessionLocal = sessionmaker(bind=engine)
# Base.metadata.create_all(engine)

