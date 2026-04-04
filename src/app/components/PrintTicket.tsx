import { QRCodeSVG } from 'qrcode.react'

interface PrintTicketProps {
  order: {
    order_number: string
    status: string
    problem_description: string
    priority: string
    received_at: string
    public_token?: string
  }
  customer?: { full_name: string; phone?: string; email?: string }
  device?: { brand: string; model: string; device_type: string; serial_number?: string }
  companySettings?: {
    name?: string
    logo_url?: string
    slogan?: string
    phone?: string
    address?: string
    policies?: string
  }
}

export function PrintTicket({ order, customer, device, companySettings }: PrintTicketProps) {
  const qrUrl = order.public_token 
  ? `https://tecnosolution.com.ar/consulta?token=${order.public_token}`
  : `https://tecnosolution.com.ar/consulta?orden=${order.order_number}`

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-ticket, #print-ticket * { visibility: visible; }
          #print-ticket { position: fixed; top: 0; left: 0; width: 100%; }
          @page { margin: 4mm; }
        }
        #print-ticket {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          max-width: 80mm;
          margin: 0 auto;
          padding: 4px;
          color: #000;
        }
        #print-ticket .center { text-align: center; }
        #print-ticket .bold { font-weight: bold; }
        #print-ticket .large { font-size: 16px; }
        #print-ticket .divider { border-top: 1px dashed #000; margin: 6px 0; }
        #print-ticket .row { display: flex; justify-content: space-between; margin: 2px 0; }
        #print-ticket .label { color: #555; }
        #print-ticket .qr { display: flex; justify-content: center; margin: 8px 0; }
        #print-ticket .policies { font-size: 9px; margin-top: 6px; }
      `}</style>

      <div id="print-ticket">
        <div className="center">
          {companySettings?.logo_url && (
            <img src={companySettings.logo_url} alt="Logo" style={{ maxHeight: '40px', marginBottom: '4px' }} />
          )}
          <div className="bold large">{companySettings?.name || 'TecnoSolution'}</div>
          {companySettings?.slogan && <div style={{ fontSize: '10px' }}>{companySettings.slogan}</div>}
          {companySettings?.address && <div style={{ fontSize: '10px' }}>{companySettings.address}</div>}
          {companySettings?.phone && <div style={{ fontSize: '10px' }}>Tel: {companySettings.phone}</div>}
        </div>

        <div className="divider" />

        <div className="center bold large">{order.order_number}</div>
        <div className="center" style={{ fontSize: '10px' }}>
          {new Date(order.received_at).toLocaleString('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })}
        </div>

        <div className="divider" />

        {customer && (
          <>
            <div className="bold" style={{ fontSize: '11px' }}>CLIENTE</div>
            <div>{customer.full_name}</div>
            {customer.phone && <div>Tel: {customer.phone}</div>}
            {customer.email && <div style={{ fontSize: '10px' }}>{customer.email}</div>}
            <div className="divider" />
          </>
        )}

        {device && (
          <>
            <div className="bold" style={{ fontSize: '11px' }}>DISPOSITIVO</div>
            <div>{device.device_type} {device.brand} {device.model}</div>
            {device.serial_number && <div style={{ fontSize: '10px' }}>S/N: {device.serial_number}</div>}
            <div className="divider" />
          </>
        )}

        <div className="bold" style={{ fontSize: '11px' }}>PROBLEMA REPORTADO</div>
        <div style={{ fontSize: '11px', wordBreak: 'break-word' }}>{order.problem_description}</div>

        <div className="divider" />

        <div className="row">
          <span className="label">Prioridad:</span>
          <span className="bold">{order.priority.toUpperCase()}</span>
        </div>

        <div className="divider" />

        <div className="center" style={{ fontSize: '10px', marginBottom: '4px' }}>
          Escaneá para ver el estado de tu reparacion
        </div>
        <div className="qr">
          <QRCodeSVG value={qrUrl} size={100} />
        </div>
        <div className="center" style={{ fontSize: '9px', wordBreak: 'break-all' }}>{qrUrl}</div>

        <div className="divider" />

        {companySettings?.policies && (
          <div className="policies">{companySettings.policies}</div>
        )}

        <div className="divider" />
        <div className="center" style={{ fontSize: '10px' }}>Gracias por elegirnos</div>
      </div>
    </>
  )
}
