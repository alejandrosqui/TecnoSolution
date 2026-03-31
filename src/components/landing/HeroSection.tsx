import { motion } from "framer-motion";
import { Wrench, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-dashboard.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-hero overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-secondary/10 blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-primary p-2 rounded-lg">
            <Wrench className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-primary-foreground">TecnoRep</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-primary-foreground/70">
          <a href="#features" className="hover:text-primary-foreground transition-colors">Funcionalidades</a>
          <a href="#pricing" className="hover:text-primary-foreground transition-colors">Planes</a>
          <a href="#contact" className="hover:text-primary-foreground transition-colors">Contacto</a>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
            Iniciar sesión
          </Button>
          <Button className="bg-gradient-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity">
            Prueba gratis
          </Button>
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 container mx-auto px-6 pt-16 pb-24 lg:pt-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 mb-6">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-sm text-primary-foreground/80">Plataforma #1 para talleres técnicos</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              Gestión integral para tu{" "}
              <span className="text-gradient-primary">taller de reparación</span>
            </h1>
            <p className="text-lg text-primary-foreground/70 max-w-lg mb-8 leading-relaxed">
              Órdenes de trabajo, seguimiento en tiempo real, notificaciones automáticas y dashboard inteligente. Todo lo que necesitás para profesionalizar tu servicio técnico.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-gradient-accent text-accent-foreground font-semibold text-base px-8 hover:opacity-90 transition-opacity">
                Empezar gratis
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                Ver demo
              </Button>
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-primary-foreground/50">
              <span>✓ Sin tarjeta de crédito</span>
              <span>✓ 10 órdenes gratis/mes</span>
              <span>✓ Setup en 2 minutos</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-elevated border border-primary-foreground/10">
              <img
                src={heroImage}
                alt="Dashboard de TecnoRep mostrando gestión de órdenes de trabajo"
                width={1280}
                height={800}
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
            </div>
            {/* Floating stat card */}
            <motion.div
              className="absolute -bottom-6 -left-6 glass rounded-xl p-4 shadow-elevated border border-border"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="text-xs text-muted-foreground mb-1">Órdenes hoy</div>
              <div className="font-heading text-2xl font-bold text-foreground">24</div>
              <div className="text-xs text-secondary">+12% vs ayer</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
