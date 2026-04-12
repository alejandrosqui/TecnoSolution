import { QRCodeSVG } from 'qrcode.react'

interface StickerLabelProps {
  order: {
    order_number: string
    public_token?: string
    received_at: string
  }
  device?: { brand: string; model: string }
  customer?: { full_name: string }
  companyName?: string
}

export function StickerLabel({ order, device, customer, companyName }: StickerLabelProps) {
  const qrUrl = order.public_token
    ? `https://tecnosolution.com.ar/consulta?token=${order.public_token}`
    : `https://tecnosolution.com.ar/consulta?orden=${order.order_number}`

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #sticker-label, #sticker-label * { visibility: visible; }
          #sticker-label { position: fixed; top: 0; left: 0; }
          @page { margin: 0; size: 50mm 30mm; }
        }
        #sticker-label {
          font-family: 'Courier New', monospace;
          width: 50mm;
          height: 30mm;
          padding: 1.5mm;
          display: flex;
          align-items: center;
          gap: 2mm;
          color: #000;
          box-sizing: border-box;
          overflow: hidden;
        }
        #sticker-label .qr-side { flex-shrink: 0; }
        #sticker-label .info-side { flex: 1; overflow: hidden; }
        #sticker-label .order-num {
          font-size: 9px;
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        #sticker-label .detail {
          font-size: 7px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #333;
          margin-top: 0.5mm;
        }
        #sticker-label .company {
          font-size: 6px;
          color: #666;
          margin-top: 1.5mm;
        }
        #sticker-label .date {
          font-size: 6px;
          color: #555;
          margin-top: 0.5mm;
        }
      `}</style>

      <div id="sticker-label">
        <div className="qr-side">
          <QRCodeSVG value={qrUrl} size={72} />
        </div>
        <div className="info-side">
          <div className="order-num">{order.order_number}</div>
          {device && (
            <div className="detail">{device.brand} {device.model}</div>
          )}
          {customer && (
            <div className="detail">{customer.full_name}</div>
          )}
          <div className="date">
            {new Date(order.received_at).toLocaleDateString('es-AR')}
          </div>
          {companyName && (
            <div className="company">{companyName}</div>
          )}
        </div>
      </div>
    </>
  )
}
