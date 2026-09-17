import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-black">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <img src="/Images/logo%20sin%20fondo%20blanco.png" alt="Grow" className="w-12 h-12 object-contain" />
            <div>
              <span className="font-display uppercase tracking-widest font-bold text-white text-lg block leading-tight">Creative Education Studio</span>
            </div>
          </div>
          <p className="font-body text-sm text-white mt-2">
            Un estudio creativo dedicado a la costura, el bordado y el diseño. Aprendé a tu ritmo con acompañamiento profesional.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="https://www.instagram.com/grow.education.dl/" target="_blank" rel="noreferrer"
              className="text-xs text-white hover:opacity-90 transition-colors">Instagram</a>
            <a href="https://www.facebook.com/profile.php?id=100078447143035" target="_blank" rel="noreferrer"
              className="text-xs text-white hover:opacity-90 transition-colors">Facebook</a>
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Navegación</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="text-white hover:text-[#F7C1D6] transition-colors">Inicio</Link></li>
            <li><Link to="/cursos" className="text-white hover:text-[#F7C1D6] transition-colors">Cursos</Link></li>
            <li><Link to="/login" className="text-white hover:text-[#F7C1D6] transition-colors">Iniciar sesión</Link></li>
            <li><Link to="/registro" className="text-white hover:text-[#F7C1D6] transition-colors">Registrarse</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Contacto</h4>
          <p className="text-sm text-white">📍 Redfern, Sídney, Australia</p>
          <p className="text-sm text-white mt-1">📱 WhatsApp: +61 401 956 520</p>
          <p className="text-sm text-white mt-1">🌐 Clases online disponibles</p>
        </div>
      </div>
      <div className="border-t border-text-cocoa text-center py-4 text-xs text-white">
        © 2026 Creative Education Studio · Daiana Lubo Núñez · Todos los derechos reservados.
      </div>
    </footer>
  );
}
