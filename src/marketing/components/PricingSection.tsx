import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

const plans = [
  {
    name: "Gratis",
    price: "0",
    description: "Ideal para empezar y probar la plataforma.",
    features: [
      "1 local",
      "1 usuario",
      "10 órdenes/mes",
      "Comprobantes PDF",
      "Firma digital",
      "Dashboard básico",
    ],
    cta: "Empezar gratis",
    popular: false,
  },
  {
    name: "Profesional",
    price: "36.800",
    description: "Para talleres en crecimiento que necesitan más.",
    features: [
      "Hasta 3 locales",
      "5 usuarios incluidos",
      "Órdenes ilimitadas",
      "Notificaciones WhatsApp",
      "Stock de repuestos",
      "Garantías automatizadas",
      "Dashboard avanzado",
      "Soporte prioritario",
    ],
    cta: "Elegir Profesional",
    popular: true,
  },
  {
    name: "Empresa",
    price: "89.400",
    description: "Para cadenas y talleres con múltiples sucursales.",
    features: [
      "Locales ilimitados",
      "Usuarios ilimitados",
      "Órdenes ilimitadas",
      "IA conversacional 24hs",
      "WhatsApp Business API",
      "Dashboard multilocal",
      "API completa",
      "Onboarding dedicado",
    ],
    cta: "Contactar ventas",
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 bg-muted/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-secondary uppercase tracking-wider">Planes</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            Elegí el plan para tu taller
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Empezá gratis y escalá a medida que tu negocio crece. Sin compromisos, cancelá cuando quieras.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? "bg-card shadow-elevated border-2 border-primary scale-105"
                  : "bg-card shadow-card border border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-accent text-accent-foreground text-xs font-semibold">
                  Más popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-heading text-xl font-bold text-card-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>
              <div className="mb-6">
                <span className="font-heading text-4xl font-bold text-card-foreground">${plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.price === "0" ? "" : "/mes por local"}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-card-foreground">
                    <Check className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full font-semibold ${
                  plan.popular
                    ? "bg-gradient-primary text-primary-foreground hover:opacity-90"
                    : ""
                }`}
                variant={plan.popular ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
