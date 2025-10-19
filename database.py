from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

#Conexão com o banco de dados sqlite
DATABASE_URL = "sqlite:///./produtos.db"

#Criar engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread":False})

#Sessão
SessionLocal = sessionmaker(bind=engine)

#Base para models
Base = declarative_base()

#Função para injetor sessão no fastapi
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

