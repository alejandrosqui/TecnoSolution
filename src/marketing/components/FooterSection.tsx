import { Wrench } from "lucide-react";

const FooterSection = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-primary p-2 rounded-lg">
                <Wrench className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-heading text-lg font-bold">TecnoSolution</span>
            </div>
            <p className="text-sm text-background/60 leading-relaxed">
              Gestion profesional para talleres de servicio tecnico.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 text-background/80 uppercase tracking-wide">Plataforma</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><a href="#features" className="hover:text-background transition-colors">Funcionalidades</a></li>
              <li><a href="#pricing" className="hover:text-background transition-colors">Planes y precios</a></li>
              <li><a href="/registro" className="hover:text-background transition-colors">Crear cuenta gratis</a></li>
              <li><a href="/login" className="hover:text-background transition-colors">Iniciar sesion</a></li>
              <li><a href="/consulta" className="hover:text-background transition-colors">Consultar estado de equipo</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 text-background/80 uppercase tracking-wide">Contacto</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><a href="mailto:alejandrosqui080@gmail.com" className="hover:text-background transition-colors">alejandrosqui080@gmail.com</a></li>
              <li className="text-background/40">Caleta Olivia, Santa Cruz, Argentina</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/40">
            2026 TecnoSolution. Todos los derechos reservados.
          </p>
          <p className="text-xs text-background/40">
            Desarrollado por <a href="https://patagoniasoftware.com.ar" target="_blank" rel="noopener noreferrer" className="text-background/60 hover:text-background transition-colors font-medium">Patagonia Software</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
