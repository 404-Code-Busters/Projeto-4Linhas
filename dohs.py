"""#models.py
class Usuario(Base):
    __tablename__="usuarios"
    id=Column(Integer,primary_key=True,index=True)
    nome=Column(String(50))
    email=Column(String(100),unique=True)
    senha=Column(String(200))
    is_admin=Column(Boolean,default=False)#novo campo
    #relação entre as tabelas
    pedidos=relationship("Pedido",back_populates="usuario")

#criar novas tabelas
class Pedido(Base):
    __tablename__="pedidos"
    id=Column(Integer,primary_key=True,index=True)
    usuario_id=Column(Integer,ForeignKey("usuarios.id"))
    total=Column(Float,default=0.0)
    usuario=relationship("Usuario",back_populates="pedidos")
    itens=relationship("ItemPedido",back_populates="pedido")


class ItemPedido(Base):
    __tablename__="itens_pedido"
    id=Column(Integer,primary_key=True,index=True)
    pedido_id=Column(Integer,ForeignKey("pedidos.id"))
    produto_id=Column(Integer,ForeignKey("produtos.id"))
    quantidade=Column(Integer)
    preco_unitario=Column(Float)
    pedido=relationship("Pedido",back_populates="itens")


#criar banco de dados com a tabela e colunas
Base.metadata.create_all(bind=engine)
#adicionar uma coluna nova
#with engine.connect() as conexao:
#    conexao.execute(text(
#'ALTER TABLE usuarios ADD COLUMN is_admin BOOLEAN DEFAULT 0'
#    ))
#db=SessionLocal()
#admin=Usuario(nome="admin",email="admin@loja.com",
#              senha=gerar_hash_senha("123456"),is_admin=True)
#db.add(admin)
#db.commit()

###########################
#controller.py
from models import Produto,Usuario,ItemPedido,Pedido#import novo"""