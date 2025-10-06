from database import SessionLocal
from model.produtos import Produtos
#criar produtos no banco de dados/ TA FUNCIONANDO
def criar_produtos(nome:str,descricao:str,preco:float,estoque:int):
    try:
        session = SessionLocal()
        novo_produto = Produtos(nome = nome, descricao = descricao,
                            preco = preco , estoque = estoque)
        session.add(novo_produto)#adicionando na tabela
        session.commit()
        session.close()
    
    except ValueError:
        # Caso ocorra qualquer erro 
        print("Erro ao cadastrar produto")
#listar produtos do banco de dados/TA FUNCIONANDO
def listar_produtos():
    session = SessionLocal()
    produtos = session.query(Produtos).all()
    for produto in produtos:#printa cada item da tabela
        print(F"""
            ID: {produto.id_produto}
            Produto: {produto.nome}
            Descrição: {produto.descricao}
            Valor: {produto.preco}
            Quantidade: {produto.estoque}
            Data de cadastro: {produto.data_cadastro}
            """)
    session.close()
    
#atualizar produtos já existentes/funcionando
def atualizar_produtos():
    try:
        id = int(input("Qual ID do produto que vai ser atualizado: "))
        session = SessionLocal()
        atualizar_produto = session.query(Produtos).filter_by(id_produto = id).first()
        #verifica se o produto existe
        if atualizar_produto:
            atualizar_produto.nome = input("Novo produto: ")
            atualizar_produto.descricao = input("Nova descrição do produto: ")
            atualizar_produto.preco = float(input("Novo preço do produto: "))
            atualizar_produto.estoque = int(input("Nova quantidade de produtos: "))
            session.commit()
        else:
            print("Produto não encontrado!")

    except ValueError:
        # Caso ocorra um erro vai fechar a sessão
        print("Erro ao atualizar produto")

#deletar produtos no banco de dados/funcionando
def deletar_produtos():
    try:
        id = int(input("Digite o ID do produto a ser excluído: "))
        session = SessionLocal()
        deletar_produto = session.query(Produtos).filter_by(id_produto=id).first()
        
        if deletar_produto:
            session.delete(deletar_produto)
            session.commit()
            print(f"Produto {id} deletado com sucesso.")
            return {"mensagem": "Produto deletado com sucesso!"}
        else:
            print(f"Erro: produto com ID {id} não encontrado.")
            
    except ValueError:
        # Caso ocorra um erro vai fechar a sessão
        print("Erro ao deletar o produto")
        session.rollback()
        session.close()