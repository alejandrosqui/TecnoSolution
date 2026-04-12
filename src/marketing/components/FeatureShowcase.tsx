import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { PenLine, Tag, MessageCircle, Package, CheckCircle } from "lucide-react"

const features = [
  {
    icon: PenLine,
    color: "#3b82f6",
    bg: "#eff6ff",
    title: "Firma electrónica",
    desc: "El cliente firma al dejar y al retirar el equipo",
    visual: "signature",
  },
  {
    icon: Tag,
    color: "#10b981",
    bg: "#ecfdf5",
    title: "Sticker QR",
    desc: "Imprimí y pegalo directo en el dispositivo",
    visual: "sticker",
  },
  {
    icon: MessageCircle,
    color: "#f59e0b",
    bg: "#fffbeb",
    title: "WhatsApp automático",
    desc: "El cliente recibe el estado sin que hagas nada",
    visual: "whatsapp",
  },
  {
    icon: Package,
    color: "#8b5cf6",
    bg: "#f5f3ff",
    title: "Stock y garantías",
    desc: "Control de repuestos con alertas de mínimo",
    visual: "stock",
  },
]

function SignatureVisual() {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
      <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>Firma del cliente</p>
      <div style={{ border: "2px dashed #cbd5e1", borderRadius: 8, height: 80, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <motion.svg width="160" height="50" viewBox="0 0 160 50">
          <motion.path
            d="M10 35 C30 10, 50 45, 70 25 C90 5, 110 40, 150 20"
            fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </motion.svg>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
        style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}
      >
        <CheckCircle size={14} color="#10b981" />
        <span style={{ fontSize: 11, color: "#10b981" }}>Guardada en la orden</span>
      </motion.div>
    </div>
  )
}

function StickerVisual() {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          width: 100, height: 60, background: "#fff",
          border: "1px solid #e2e8f0", borderRadius: 6,
          display: "flex", alignItems: "center", padding: 6, gap: 6,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}
      >
        <div style={{ width: 44, height: 44, background: "#1e293b", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="36" height="36" viewBox="0 0 36 36">
            {[0,1,2,3,4,5,6,7,8].map(i => (
              <rect key={i} x={3 + (i%3)*11} y={3 + Math.floor(i/3)*11} width={8} height={8}
                fill={[0,2,6,8].includes(i) ? "#fff" : i===4 ? "#fff" : "#fff"}
                opacity={[0,2,6,8,4].includes(i) ? 1 : 0.3}
              />
            ))}
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 7, fontWeight: "bold", color: "#1e293b" }}>WO-2026-0042</div>
          <div style={{ fontSize: 6, color: "#64748b" }}>Samsung A54</div>
          <div style={{ fontSize: 6, color: "#64748b" }}>12/04/2026</div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
        style={{ fontSize: 11, color: "#64748b" }}
      >
        → Imprime en<br />la Y50
      </motion.div>
    </div>
  )
}

function WhatsAppVisual() {
  const messages = [
    { text: "Tu equipo cambió de estado", sub: "🔧 En diagnóstico", delay: 0.2 },
    { text: "Presupuesto aprobado", sub: "✅ Aprobado — $15.000", delay: 1.0 },
    { text: "Listo para retirar", sub: "📦 Pasá cuando quieras", delay: 1.8 },
  ]
  return (
    <div style={{ background: "#e5ddd5", borderRadius: 12, padding: 12, minHeight: 100 }}>
      {messages.map((m, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: m.delay }}
          style={{
            background: "#fff", borderRadius: 8, padding: "6px 10px",
            marginBottom: 6, maxWidth: "85%", boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
          }}
        >
          <div style={{ fontSize: 10, color: "#1e293b" }}>TecnoSolution</div>
          <div style={{ fontSize: 11, color: "#075e54", fontWeight: "bold" }}>{m.sub}</div>
          <div style={{ fontSize: 10, color: "#667781", marginTop: 2 }}>{m.text}</div>
        </motion.div>
      ))}
    </div>
  )
}

function StockVisual() {
  const items = [
    { name: "Pantalla iPhone 13", stock: 3, min: 5, alert: true },
    { name: "Batería Samsung A54", stock: 8, min: 3, alert: false },
    { name: "Conector de carga", stock: 1, min: 4, alert: true },
  ]
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 12, border: "1px solid #e2e8f0" }}>
      {items.map((item, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.3 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}
        >
          <span style={{ fontSize: 10, color: "#334155" }}>{item.name}</span>
          <span style={{
            fontSize: 10, fontWeight: "bold", padding: "2px 6px", borderRadius: 4,
            background: item.alert ? "#fef2f2" : "#f0fdf4",
            color: item.alert ? "#ef4444" : "#16a34a"
          }}>
            {item.stock} u. {item.alert ? "⚠️" : "✓"}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

const visuals = { signature: SignatureVisual, sticker: StickerVisual, whatsapp: WhatsAppVisual, stock: StockVisual }

export function FeatureShowcase() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % features.length), 4000)
    return () => clearInterval(t)
  }, [])

  const f = features[current]
  const Visual = visuals[f.visual as keyof typeof visuals]

  return (
    <div style={{
      background: "#0f172a", borderRadius: 20, padding: 24,
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
      minHeight: 280,
    }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {features.map((_, i) => (
          <div key={i}
            onClick={() => setCurrent(i)}
            style={{
              flex: 1, height: 3, borderRadius: 2, cursor: "pointer",
              background: i === current ? f.color : "rgba(255,255,255,0.15)",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ background: f.bg, padding: 8, borderRadius: 8 }}>
              <f.icon size={18} color={f.color} />
            </div>
            <div>
              <div style={{ color: "#f1f5f9", fontWeight: "bold", fontSize: 15 }}>{f.title}</div>
              <div style={{ color: "#94a3b8", fontSize: 12 }}>{f.desc}</div>
            </div>
          </div>
          <Visual />
        </motion.div>
      </AnimatePresence>

      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
        {features.map((feat, i) => (
          <div key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? 20 : 6, height: 6, borderRadius: 3, cursor: "pointer",
              background: i === current ? feat.color : "rgba(255,255,255,0.2)",
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  )
}
