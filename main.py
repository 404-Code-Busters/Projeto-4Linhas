from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from controllers import admin, carrinho, cliente, main, pedido, cupom, frete

app = FastAPI(title="Ecommerce Esportes")
app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(admin.router)
app.include_router(carrinho.router)
app.include_router(cliente.router)
app.include_router(main.router)
app.include_router(pedido.router)
app.include_router(cupom.router)
app.include_router(frete.router)

# python -m uvicorn main:app --reload