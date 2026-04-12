import httpx
import os

EVOLUTION_URL = os.getenv("EVOLUTION_API_URL", "https://wa.tecnosolution.com.ar")
EVOLUTION_KEY = os.getenv("EVOLUTION_API_KEY", "tecnosolution_evo_key_2026")


async def send_whatsapp_message(phone: str, message: str, instance: str = "tecnosolution-demo") -> bool:
    """
    Envía un mensaje de WhatsApp via Evolution API.
    phone: número en formato internacional sin + (ej: 5492974555213)
    Retorna True si se envió, False si falló silenciosamente.
    """
    if not phone:
        return False

    # Normalizar teléfono — solo dígitos, agregar 54 si es argentino
    digits = "".join(c for c in phone if c.isdigit())
    if not digits:
        return False
    if digits.startswith("0"):
        digits = digits[1:]
    if not digits.startswith("54"):
        digits = "54" + digits

    number = f"{digits}@s.whatsapp.net"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{EVOLUTION_URL}/message/sendText/{instance}",
                headers={"apikey": EVOLUTION_KEY, "Content-Type": "application/json"},
                json={"number": number, "text": message},
            )
            return resp.status_code == 201
    except Exception as e:
        print(f"WHATSAPP ERROR: {e}")
        return False


def build_status_message(
    customer_name: str,
    order_number: str,
    status_display: str,
    company_name: str,
    public_token: str,
) -> str:
    url = f"https://tecnosolution.com.ar/consulta?token={public_token}"
    return (
        f"Hola {customer_name}\n\n"
        f"Te informamos que tu equipo en *{company_name}* actualizó su estado:\n\n"
        f"📋 Orden: *{order_number}*\n"
        f"🔧 Estado: *{status_display}*\n\n"
        f"Podés ver el detalle acá:\n{url}\n\n"
        f"_Cualquier consulta respondé este mensaje._"
    )
