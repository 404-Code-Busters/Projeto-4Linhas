from email.message import EmailMessage
import aiosmtplib

SMTP_EMAIL = "4linhasesportes.ofc@gmail.com"
SMTP_PASSWORD = "egvd ctuo eveu tviw"
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# email após cadastrar (versão responsiva)
async def send_welcome_email(to_email: str):
    msg = EmailMessage()
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email
    msg["Subject"] = "Bem-vindo ao nosso site!"

    # HTML responsivo
    html_content = """\
<html>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">

  <!-- Container principal -->
  <div style="
      max-width: 600px;
      width: 100%;
      margin: auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  ">

    <!-- Header -->
    <div style="
        background-color: #ff4d4f;
        padding: 25px;
        text-align: center;
        color: white;
    ">
      <h1 style="margin: 0; font-size: 24px;">4Linhas Esportes</h1>
      <p style="margin: 6px 0 0; font-size: 14px;">Bem-vindo ao nosso time! ⚽🔥</p>
    </div>

    <!-- Corpo -->
    <div style="padding: 25px;">

      <h2 style="color: #333; margin-top: 0; text-align: center;">
        Bem-vindo! 🎉
      </h2>

      <p style="font-size: 16px; color: #555; line-height: 1.6;">
        Estamos muito felizes por ter você com a gente na <strong>4Linhas</strong>,
        o seu e-commerce de artigos esportivos preferido.
      </p>

      <p style="font-size: 16px; color: #555; line-height: 1.6;">
        Como agradecimento, aqui está seu <strong>cupom exclusivo de boas-vindas</strong>:
      </p>

      <!-- Cupom -->
      <div style="text-align: center; margin: 30px 0;">
        <div style="
            display: inline-block;
            background-color: #ff4d4f;
            color: white;
            font-weight: bold;
            padding: 16px 28px;
            border-radius: 10px;
            font-size: 22px;
            letter-spacing: 1px;
            box-shadow: 0 3px 10px rgba(255, 77, 79, 0.35);
            width: auto;
        ">
          BEMVINDO10
        </div>

        <p style="font-size: 14px; color: #777; margin-top: 10px;">
          Use no checkout para garantir seu desconto 🎁
        </p>
      </div>

      <p style="font-size: 16px; color: #444; line-height: 1.6;">
        Aproveite para explorar nossas categorias e encontrar
        o que combina com seu esporte favorito.
      </p>

      <p style="font-size: 16px; color: #444; line-height: 1.6;">
        Boas compras e bons treinos! 🏃‍♂️⚽🏀
      </p>

      <p style="margin-top: 25px; font-size: 14px; color: #777; text-align: center;">
        Qualquer dúvida, nossa equipe está pronta para ajudar.
      </p>

    </div>

    <!-- Rodapé -->
    <div style="
        background-color: #fafafa;
        text-align: center;
        padding: 15px;
        font-size: 12px;
        color: #888;
    ">
      © 2025 4Linhas Esportes — Todos os direitos reservados.
    </div>

  </div>

</body>
</html>
"""

    msg.set_content("Obrigado por se cadastrar! Seu cupom é: BEMVINDO10")
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


# email ao completar o pedido (versão responsiva)
async def send_order_email(to_email: str, pedido, itens):
    msg = EmailMessage()
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email
    msg["Subject"] = f"Obrigado pela sua compra! Pedido #{pedido.id_pedido}"

    # Fallback (texto simples)
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

    # HTML dos itens com imagem + responsivo
    html_itens = ""
    for item in itens:
        imagem = item.get("imagem", "https://via.placeholder.com/80")

        html_itens += f"""
        <tr>
            <td style="padding: 15px 5px; border-bottom: 1px solid #eee; text-align: center;">
                <img src="{imagem}" 
                     style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                <div style="font-weight: bold; margin-top: 5px;">{item['nome']}</div>
            </td>

            <td style="padding: 15px 5px; border-bottom: 1px solid #eee; text-align: center;">
                {item['quantidade']}
            </td>

            <td style="padding: 15px 5px; border-bottom: 1px solid #eee; text-align: center;">
                R$ {item['preco']:.2f}
            </td>
        </tr>
        """

    # HTML final responsivo
    html_content = f"""
<html>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">

<!-- Container responsivo -->
<div style="
    max-width: 600px;
    width: 100%;
    margin: auto;
    background: #ffffff;
    padding: 20px;
    border-radius: 10px;
">

    <h2 style="color: #FF6B35; text-align: center; margin-top: 0;">
        Obrigado pela sua compra! 🎉
    </h2>

    <p style="font-size: 16px; text-align: center;">
        Seu pedido <strong>#{pedido.id_pedido}</strong> foi confirmado!
    </p>

    <!-- Tabela responsiva -->
    <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; min-width: 300px;">
            <thead>
                <tr style="background-color: #FF6B35; color: white;">
                    <th style="padding: 12px;">Produto</th>
                    <th style="padding: 12px;">Qtde</th>
                    <th style="padding: 12px;">Preço</th>
                </tr>
            </thead>
            <tbody>
                {html_itens}
            </tbody>
        </table>
    </div>

    <p style="margin-top: 25px; font-size: 20px; text-align: right;">
        <strong>Total:</strong> R$ {pedido.valor_total:.2f}
    </p>

    <p style="text-align: center; margin-top: 30px;">
        <a href="#" 
           style="
                background-color:#FF6B35;
                color:white;
                padding:12px 25px;
                border-radius:8px;
                text-decoration:none;
                font-size:16px;
                display:inline-block;
            ">
            Acompanhar Pedido 🚚
        </a>
    </p>

    <p style="margin-top: 20px; text-align: center; font-size: 15px;">
        Obrigado por comprar conosco! 🛒<br>
        <strong>Equipe 4Linhas</strong>
    </p>

</div>

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