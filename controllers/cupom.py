from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.models import Cupom

router = APIRouter(prefix="/api/cupom", tags=["Cupom"])

@router.get("/validar")
def validar_cupom(codigo: str, total: float, db: Session = Depends(get_db)):
    cupom = db.query(Cupom).filter_by(chave_cupon=codigo, ativo=True).first()

    if not cupom:
        return {"success": False, "msg": "Cupom inválido ou expirado."}

    # calcula o desconto em percentual
    desconto = total * cupom.valor_desconto

    desconto = round(desconto, 2)

    return {
        "success": True,
        "desconto": desconto,
        "novo_total": round(total - desconto, 2)
    }