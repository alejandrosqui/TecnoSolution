import { motion } from "framer-motion";
import {
  ClipboardList,
  Bell,
  BarChart3,
  Camera,
  QrCode,
  Shield,
  Package,
  Settings,
} from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Órdenes de trabajo completas",
    description: "Recepción con datos del cliente, dispositivo, problema reportado, prioridad y ticket imprimible al instante.",
  },
  {
    icon: Camera,
    title: "Registro fotográfico",
    description: "Hasta 5 fotos al ingreso del equipo. Evidencia visual almacenada en la nube, accesible desde cualquier dispositivo.",
  },
  {
    icon: QrCode,
    title: "QR de seguimiento para el cliente",
    description: "Cada ticket incluye un QR único. El cliente escanea y ve el estado de su reparación en tiempo real, sin llamadas.",
  },
  {
    icon: Bell,
    title: "Notificaciones automáticas por email",
    description: "Tu cliente recibe un email automático cada vez que cambia el estado de su equipo. Sin esfuerzo extra.",
  },
  {
    icon: BarChart3,
    title: "Dashboard con alertas de envejecimiento",
    description: "Visualizá todas las órdenes activas con indicadores de color según su antigüedad. Verde, amarillo y rojo para priorizar.",
  },
  {
    icon: Settings,
    title: "Configuración por empresa",
    description: "Logo, eslogan, colores, políticas y tiempos de alerta personalizados para cada taller. Tu marca, tu sistema.",
  },
  {
    icon: Shield,
    title: "Garantías",
    description: "Registro de garantías por orden con fechas y condiciones. Control total del período post-reparación.",
  },
  {
    icon: Package,
    title: "Stock de repuestos",
    description: "Gestión básica de inventario para asociar repuestos a órdenes y controlar existencias.",
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
            Todo lo que tu taller necesita hoy
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

        {/* Próximamente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Próximamente:</span> WhatsApp Business, firma digital, IA conversacional 24hs, app mobile y más.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
