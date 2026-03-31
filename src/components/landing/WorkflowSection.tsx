import { motion } from "framer-motion";
import { ArrowRight, Smartphone, Monitor, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    title: "Recepción del equipo",
    description: "Registrá cliente, dispositivo, fotos y firma digital. Se genera el comprobante PDF automáticamente.",
  },
  {
    number: "02",
    title: "Diagnóstico y presupuesto",
    description: "El técnico evalúa, carga ítems con costo/precio y envía el presupuesto al cliente para aprobación.",
  },
  {
    number: "03",
    title: "Reparación con seguimiento",
    description: "Cada cambio de estado queda registrado con fecha, hora y usuario. El cliente recibe notificaciones.",
  },
  {
    number: "04",
    title: "Entrega documentada",
    description: "Fotos de entrega, segunda firma y cierre de orden. Historial completo guardado por siempre.",
  },
];

const WorkflowSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-secondary uppercase tracking-wider">Flujo de trabajo</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            De la recepción a la entrega, sin papeles
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Un proceso claro y profesional que genera confianza en tus clientes.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12 }}
              className="relative"
            >
              <span className="font-heading text-6xl font-bold text-primary/10">{step.number}</span>
              <h3 className="font-heading text-lg font-semibold text-foreground mt-2 mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              {index < steps.length - 1 && (
                <ArrowRight className="hidden md:block absolute top-8 -right-4 w-6 h-6 text-primary/30" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Device types */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-8 py-8 border-t border-border"
        >
          <div className="flex items-center gap-3 text-muted-foreground">
            <Smartphone className="w-5 h-5" />
            <span className="text-sm">Celulares</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Tablet className="w-5 h-5" />
            <span className="text-sm">Tablets</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Monitor className="w-5 h-5" />
            <span className="text-sm">PCs y Notebooks</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WorkflowSection;
