# controllers/frete.py   # NOVO ARQUIVO

from fastapi import APIRouter, Query, Request, Depends, HTTPException
import httpx
import math
from urllib.parse import quote # Importa a função para codificar a URL
from auth import verificar_token


router = APIRouter(prefix="/api/frete")

# Função haversine para calcular distância entre CEPs
def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371  # km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

# Buscar latitude/longitude pelo CEP usando geocodificador gratuito
async def get_lat_lon_from_cep(cep: str):
    cep_limpo = cep.replace("-", "").strip()
    headers = {"User-Agent": "Ecommerce-4linhas/1.0"}

    try:
        # --- TENTATIVA 1: Buscar diretamente pelo CEP ---
        url_cep = f"https://nominatim.openstreetmap.org/search?postalcode={cep_limpo}&country=Brazil&format=json"
        async with httpx.AsyncClient() as client:
            response = await client.get(url_cep, headers=headers)
            response.raise_for_status()
            data = response.json()
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])

        # --- TENTATIVA 2 (Fallback): Usar ViaCEP para obter o endereço e depois buscar ---
        url_viacep = f"https://viacep.com.br/ws/{cep_limpo}/json/"
        async with httpx.AsyncClient() as client:
            response_viacep = await client.get(url_viacep)
            response_viacep.raise_for_status()
            dados_endereco = response_viacep.json()

        if dados_endereco.get("erro"):
            return None

        # Constrói uma query de busca com o endereço obtido
        logradouro = dados_endereco.get("logradouro", "")
        cidade = dados_endereco.get("localidade", "")
        estado = dados_endereco.get("uf", "")
        query_endereco_raw = f"{logradouro}, {cidade}, {estado}"
        query_endereco_encoded = quote(query_endereco_raw) # Codifica o endereço para a URL

        url_endereco = f"https://nominatim.openstreetmap.org/search?q={query_endereco_encoded}&country=Brazil&format=json"
        async with httpx.AsyncClient() as client:
            response_nominatim = await client.get(url_endereco, headers=headers)
            response_nominatim.raise_for_status()
            data_final = response_nominatim.json()
            if data_final:
                return float(data_final[0]["lat"]), float(data_final[0]["lon"])

        return None # Não encontrou em nenhuma das tentativas

    except (httpx.HTTPStatusError, httpx.RequestError, IndexError, KeyError) as e:
        print(f"Erro ao obter geolocalização para o CEP {cep}: {e}")
        return None


@router.get("")  # /api/frete?cep=XXXXX-XXX
async def calcular_frete(request: Request, cep: str = Query(...)):
    # Adiciona verificação de autenticação
    token = request.cookies.get("token")
    payload = verificar_token(token)
    if not payload:
        return {"success": False, "msg": "Usuário não autenticado"}


    origem_lat, origem_lon = -23.5422, -46.6066  # CEP 03008-020 (base)

    destino = await get_lat_lon_from_cep(cep)
    if not destino:
        return {"success": False, "msg": "CEP inválido"}

    dest_lat, dest_lon = destino
    distancia_km = haversine_distance(origem_lat, origem_lon, dest_lat, dest_lon)

    # -------------------------------------------
    # ✔ NOVO CÁLCULO DE FRETE E ESTIMATIVA
    # -------------------------------------------

    if distancia_km <= 10:
        frete = 15.00
        estimativa = 3  # ALTERADO
    elif distancia_km <= 20:
        frete = 25.00
        estimativa = 5  # ALTERADO
    else:
        frete = 30.00
        estimativa = 7  # ALTERADO

    return {
        "success": True,
        "distancia_km": round(distancia_km, 1),
        "frete": round(frete, 2),
        "estimativa": estimativa
    }