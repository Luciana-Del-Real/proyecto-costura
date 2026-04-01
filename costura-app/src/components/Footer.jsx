import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#3D2B1F] text-[#C4A882] mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🧵</span>
            <div>
              <span className="font-bold text-white text-lg block leading-tight">Grow</span>
              <span className="text-[#C4A882] text-xs">Textil Creative Institute</span>
            </div>
          </div>
          <p className="text-sm text-[#A08060] mt-2">
            Un estudio creativo dedicado a la costura, el bordado y el diseño. Aprendé a tu ritmo con acompañamiento profesional.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="https://www.instagram.com/growinstituto.dl/" target="_blank" rel="noreferrer"
              className="text-xs text-[#C4A882] hover:text-white transition-colors">Instagram</a>
            <a href="https://www.facebook.com/profile.php?id=100078447143035" target="_blank" rel="noreferrer"
              className="text-xs text-[#C4A882] hover:text-white transition-colors">Facebook</a>
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Navegación</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white transition-colors">Inicio</Link></li>
            <li><Link to="/cursos" className="hover:text-white transition-colors">Cursos</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Iniciar sesión</Link></li>
            <li><Link to="/registro" className="hover:text-white transition-colors">Registrarse</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Contacto</h4>
          <p className="text-sm text-[#A08060]">📍 Redfern, Sídney, Australia</p>
          <p className="text-sm text-[#A08060] mt-1">📱 WhatsApp: +61 401 956 520</p>
          <p className="text-sm text-[#A08060] mt-1">🌐 Clases online disponibles</p>
        </div>
      </div>
      <div className="border-t border-[#5C3D2A] text-center py-4 text-xs text-[#7A5C40]">
        © 2026 Grow Textil Creative Institute · Daia · Todos los derechos reservados.
      </div>
    </footer>
  );
}
