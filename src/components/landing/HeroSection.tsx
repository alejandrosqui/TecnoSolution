import { motion } from "framer-motion";
import { Wrench, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-dashboard.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Fixed electric background */}
      <div className="fixed inset-0 bg-hero -z-10">
        {/* Electric grid lines */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(185 70% 45% / 0.3) 1px, transparent 1px),
              linear-gradient(90deg, hsl(185 70% 45% / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Animated electric pulses */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px] animate-electric-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/10 blur-[100px] animate-electric-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px] animate-electric-drift" />
        {/* Spark lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="30%" x2="100%" y2="70%" stroke="hsl(185 70% 45%)" strokeWidth="1" className="animate-spark" />
          <line x1="20%" y1="0" x2="80%" y2="100%" stroke="hsl(210 90% 55%)" strokeWidth="1" className="animate-spark" style={{ animationDelay: "1.5s" }} />
          <line x1="100%" y1="20%" x2="0" y2="80%" stroke="hsl(185 70% 45%)" strokeWidth="1" className="animate-spark" style={{ animationDelay: "3s" }} />
        </svg>
      </div>

      {/* Nav */}
      <nav className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-primary p-2 rounded-lg">
            <Wrench className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-primary-foreground">TecnoSolution</span>
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
              <Button size="lg" className="bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/90 transition-colors">
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
                alt="Dashboard de TecnoSolution mostrando gestión de órdenes de trabajo"
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
