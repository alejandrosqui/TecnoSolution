import { motion } from "framer-motion";
import {
  ClipboardList,
  Bell,
  BarChart3,
  Camera,
  PenTool,
  MessageSquare,
  Shield,
  Package,
} from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Órdenes de trabajo completas",
    description: "Recepción con datos del cliente, dispositivo, fotos de ingreso, firma digital y comprobante PDF automático.",
  },
  {
    icon: Bell,
    title: "Notificaciones automáticas",
    description: "WhatsApp y email automático en cada cambio de estado. Tu cliente siempre informado sin esfuerzo.",
  },
  {
    icon: BarChart3,
    title: "Dashboard inteligente",
    description: "Métricas de órdenes activas, tiempos de reparación, ingresos y órdenes vencidas por local.",
  },
  {
    icon: Camera,
    title: "Registro fotográfico",
    description: "Hasta 6 fotos al ingreso y 4 a la entrega. Evidencia visual almacenada en la nube.",
  },
  {
    icon: PenTool,
    title: "Firma digital",
    description: "Firma del cliente en recepción y entrega. Comprobante con validez legal.",
  },
  {
    icon: MessageSquare,
    title: "IA conversacional 24hs",
    description: "Bot de WhatsApp que responde estado de órdenes, preguntas frecuentes y escala a humano.",
  },
  {
    icon: Shield,
    title: "Garantías automatizadas",
    description: "Registro de garantía con fecha de vencimiento, condiciones y alerta si el cliente vuelve en período.",
  },
  {
    icon: Package,
    title: "Stock de repuestos",
    description: "Gestión de inventario básico con costos, asociación a órdenes y control de existencias.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-secondary uppercase tracking-wider">Funcionalidades</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            Todo lo que tu taller necesita
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Desde la recepción del equipo hasta la entrega final. Cada paso documentado, automatizado y trazable.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group p-6 rounded-2xl bg-card shadow-card border border-border hover:shadow-elevated hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-card-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
