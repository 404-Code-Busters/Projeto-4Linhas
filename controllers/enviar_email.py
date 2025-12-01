from email.message import EmailMessage
import aiosmtplib

SMTP_EMAIL = "4linhasesportes.ofc@gmail.com"
SMTP_PASSWORD = "egvd ctuo eveu tviw"
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

#email após cadastrar
async def send_welcome_email(to_email: str):
    msg = EmailMessage()
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email
    msg["Subject"] = "Bem-vindo ao nosso site!"

    html_content = """\
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Bem vindo!</h2>
          <p>Seja bem-vindo à <strong>4Linhas</strong>, o seu e-commerce de artigos esportivos!</p>
          <p>Para começar, aqui está seu cupom exclusivo:</p>

          <div style="display: inline-block; background-color: #ff4d4f; color: white;
                      font-weight: bold; padding: 15px 25px; border-radius: 5px;
                      font-size: 20px; margin: 20px 0;">
              BEMVINDO10
          </div>

          <p>Use-o no checkout e aproveite o desconto!</p>
          <p>Boas compras e bons treinos! 🏃‍♂️⚽🏀</p>

          <p style="margin-top: 20px;">Tenha um ótimo dia! 😊</p>
      </body>
    </html>
    """

    msg.set_content("Olá! Seu código é: BEMVINDO10")
    msg.add_alternative(html_content, subtype="html")

    await aiosmtplib.send(
        msg,
        hostname=SMTP_SERVER,
        port=SMTP_PORT,
        start_tls=True,
        username=SMTP_EMAIL,
        password=SMTP_PASSWORD,
    )

    return True


#email ao completar o pedido
async def send_order_email(to_email: str, pedido, itens):
    msg = EmailMessage()
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email
    msg["Subject"] = f"Obrigado pela sua compra! Pedido #{pedido.id_pedido}"

    # Texto simples (fallback)
    resumo = "Itens do pedido:\n"
    for item in itens:
        resumo += f"- {item['nome']} | Qtde: {item['quantidade']} | R$ {item['preco']:.2f}\n"

    msg.set_content(f"""
Obrigado pela sua compra!

Seu pedido #{pedido.id_pedido} foi recebido e está sendo processado.

{resumo}

Total: R$ {pedido.valor_total:.2f}

Agradecemos a preferência!
Equipe 4Linhas
""")

    # HTML
    html_itens = "".join(
        f"""
        <tr>
            <td>{item['nome']}</td>
            <td>{item['quantidade']}</td>
            <td>R$ {item['preco']:.2f}</td>
        </tr>
        """
        for item in itens
    )

    html_content = f"""
    <html>
    <body style="font-family: Arial; padding: 20px;">
        <h2>Obrigado pela sua compra! 🎉</h2>

        <p>Seu pedido <strong>#{pedido.id_pedido}</strong> foi recebido!</p>

        <h3>Resumo do Pedido:</h3>

        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background-color: #FF6B35;">
                    <th>Produto</th>
                    <th>Qtde</th>
                    <th>Preço</th>
                </tr>
            </thead>
            <tbody>
                {html_itens}
            </tbody>
        </table>

        <p style="margin-top: 20px; font-size: 18px;">
            <strong>Total:</strong> R$ {pedido.valor_total:.2f}
        </p>

        <p>Obrigado por comprar conosco! 🛒</p>
        <p>Equipe 4Linhas</p>
    </body>
    </html>
    """

    msg.add_alternative(html_content, subtype="html")

    await aiosmtplib.send(
        msg,
        hostname=SMTP_SERVER,
        port=SMTP_PORT,
        start_tls=True,
        username=SMTP_EMAIL,
        password=SMTP_PASSWORD,
    )

    return True
