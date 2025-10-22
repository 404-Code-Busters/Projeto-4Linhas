from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

#Conexão com o banco de dados sqlite
DATABASE_URL = "mysql+pymysql://root:dev1t_24@localhost:3306/ecommerce_esportes"

#Criar engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

#Base para models
Base = declarative_base()

#Função para injetor sessão no fastapi
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

