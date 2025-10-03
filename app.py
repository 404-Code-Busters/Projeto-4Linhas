from controller.controller_produtos import criar_produtos,listar_produtos,atualizar_produtos,deletar_produtos

while True:
        try:           
            escolha = input("""
                        Sistema CRUD
                        1 - Adicionar um produto
                        2 - Listar Produtos
                        3 - Atualizar Produtos
                        4 - Deletar Produtos
                        0 - sair
                        : """)
            if escolha == "1":
                nome = input("Produto: ")
                descricao = input("Descrição do produto: ")
                preco = float(input("Preço do produto: "))
                quantidade = int(input("Quantidade de produtos: "))
                criar_produtos(nome,descricao,preco,quantidade)
            elif escolha == "2":
                listar_produtos()
            elif escolha == "3":
                atualizar_produtos()
            elif escolha == "4":
                deletar_produtos()
            elif escolha == "0":
                print("Saindo do sistema...")
                break
            else:
                print("Opção inválida!")
        except ValueError:
             print("Insira um valor válido! Reiniciando o programa ")

        
        