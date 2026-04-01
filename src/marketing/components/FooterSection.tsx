import { Wrench } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

const FooterSection = () => {
  return (
    <footer id="contact" className="relative bg-hero py-16">
      <div className="container mx-auto px-6">
        {/* CTA */}
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Empezá a profesionalizar tu taller hoy
          </h2>
          <p className="text-primary-foreground/60 max-w-xl mx-auto mb-8">
            Creá tu cuenta en 2 minutos. Sin tarjeta de crédito, sin compromisos. 10 órdenes gratis por mes para siempre.
          </p>
          <Button size="lg" className="bg-gradient-accent text-accent-foreground font-semibold text-base px-8 hover:opacity-90 transition-opacity">
            Crear cuenta gratis
          </Button>
        </div>

        {/* Footer links */}
        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-primary p-1.5 rounded-lg">
              <Wrench className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-sm font-bold text-primary-foreground">TecnoSolution</span>
          </div>
          <p className="text-xs text-primary-foreground/40">
            © 2026 TecnoSolution. Todos los derechos reservados.
          </p>
          <a
            href="https://patagoniasoftware.com.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors"
          >
            Desarrollado por <span className="font-semibold text-primary-foreground/60">PatagoniaSoftware</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
