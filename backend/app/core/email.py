import httpx
from app.core.config import settings

async def send_status_email(
    to_email: str,
    customer_name: str,
    order_number: str,
    status_display: str,
    company_name: str,
    public_token: str,
):
    if not settings.resend_api_key or not to_email:
        return

    consulta_url = f"https://tecnosolution.com.ar/consulta?token={public_token}"

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">{company_name}</h2>
        <p>Hola <strong>{customer_name}</strong>,</p>
        <p>Te informamos que el estado de tu equipo se actualizó:</p>
        <div style="background: #f0f4ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1e40af;">
                {status_display}
            </p>
            <p style="margin: 8px 0 0; color: #666; font-size: 14px;">Orden: {order_number}</p>
        </div>
        <a href="{consulta_url}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Ver estado de mi equipo
        </a>
        <p style="margin-top: 24px; color: #999; font-size: 12px;">
            Si no solicitaste este servicio, ignorá este mensaje.
        </p>
    </div>
    """

    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": f"{company_name} <{settings.from_email}>",
                "to": [to_email],
                "subject": f"Estado de tu equipo: {status_display} — {order_number}",
                "html": html,
            }
        )
