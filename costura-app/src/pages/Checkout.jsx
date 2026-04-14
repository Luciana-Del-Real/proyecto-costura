import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCourses } from '../context/CoursesContext';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const { id } = useParams();
  const { courses, hasCourse, isPending, requestPurchase } = useCourses();
  const course = courses.find(c => c.id === Number(id));
  const [requested, setRequested] = useState(false);
  const [copied, setCopied] = useState('');
  const { user } = useAuth();

  if (!course) return <div className="min-h-screen flex items-center justify-center"><p>Curso no encontrado</p></div>;

  if (hasCourse(course.id)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F5F0] px-4">
        <div className="text-center">
          <span className="text-5xl">✅</span>
          <h2 className="text-xl font-bold text-[#3D2B1F] mt-4">Ya tenés este curso</h2>
          <Link to={`/curso/${course.id}`} className="mt-4 inline-block bg-[#7A9E7E] text-white px-6 py-2.5 rounded-xl hover:bg-[#5E8262] transition-colors">
            Ir al curso
          </Link>
        </div>
      </div>
    );
  }

  if (isPending(course.id) || requested) {
    const userIdentifier = user?.name || user?.email || 'mi usuario';
    const whatsappMessage = `¡Hola! Acabo de abonar el curso "${course.title}". Mi usuario es ${userIdentifier}. ¡Les paso mi comprobante!`;
    const whatsappUrl = `https://wa.me/5491112345678?text=${encodeURIComponent(whatsappMessage)}`;

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F5F0] px-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-[#EDE4D6] max-w-md w-full">
          <span className="text-5xl block mb-4">⏳</span>
          <h2 className="text-2xl font-bold text-[#3D2B1F] mb-3">Solicitud de compra enviada</h2>
          <p className="text-[#A08060] mb-6">Tu comprobante está en revisión por el admin. Te notificaremos cuando se confirme.</p>
          
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#20bd5a] transition-all duration-200 mb-3 shadow-[0_4px_12px_rgba(37,211,102,0.3)] hover:-translate-y-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c-.003 1.396.366 2.76 1.056 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c.003-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.886-.58-.45-1.92-1.004-1.036-2.144.113-.153.247-.306.37-.459.124-.153.165-.256.248-.382.082-.128.041-.24-.009-.336-.05-.099-.445-1.073-.61-1.472-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
            </svg>
            Enviar comprobante por WhatsApp
          </a>

          <Link to="/mis-cursos" className="block text-[#7A9E7E] text-sm hover:text-[#5E8262] transition-colors mt-2 text-center">
            Ver mis cursos
          </Link>
        </div>
      </div>
    );
  }

  const handleRequestPurchase = () => {
    requestPurchase(course.id);
    setRequested(true);
  };

  return (
    <div className="min-h-screen bg-[#F9F5F0] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/cursos" className="text-[#7A9E7E] text-sm hover:text-[#5E8262] mb-6 inline-block">← Volver a cursos</Link>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EDE4D6] h-fit">
            <h2 className="font-bold text-[#3D2B1F] text-lg mb-4">Resumen del pedido</h2>
            <img src={course.image} alt={course.title} className="w-full h-40 object-cover rounded-xl mb-4" />
            <h3 className="font-semibold text-[#3D2B1F] mb-1">{course.title}</h3>
            <p className="text-[#A08060] text-sm mb-4">{course.description}</p>
            <div className="flex items-center gap-4 text-sm text-[#A08060] mb-4">
              <span>🕐 {course.duration}</span>
              <span>📚 {course.lessons.length} lecciones</span>
              <span>⭐ {course.rating}</span>
            </div>
            <div className="border-t border-[#EDE4D6] pt-4 flex justify-between items-center">
              <span className="text-[#6B4C3B] font-medium">Total</span>
              <span className="text-2xl font-bold text-[#3D2B1F]">${course.price.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EDE4D6]">
            <h2 className="font-bold text-[#3D2B1F] text-lg mb-4">Instrucciones de pago</h2>
            
            <div className="bg-[#F5EFE6] border border-[#EDE4D6] rounded-xl p-4 mb-4 text-sm text-[#6B4C3B]">
              <p className="mb-3"><strong>1) Transferí a la cuenta:</strong></p>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-[#EDE4D6]">
                  <div>
                    <span className="text-xs text-[#A08060] block mb-0.5">CVU / CBU</span>
                    <span className="font-mono text-[#3D2B1F] font-semibold">0000000000000000000000</span>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('0000000000000000000000');
                      setCopied('cvu');
                      setTimeout(() => setCopied(''), 2000);
                    }}
                    className="flex items-center gap-1.5 text-[#7A9E7E] hover:text-[#5E8262] font-semibold text-xs bg-[#F9F5F0] hover:bg-[#EDE4D6] px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {copied === 'cvu' ? '¡Copiado!' : '📋 Copiar'}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-[#EDE4D6]">
                  <div>
                    <span className="text-xs text-[#A08060] block mb-0.5">Alias</span>
                    <span className="font-mono text-[#3D2B1F] font-semibold">grow.costura</span>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('grow.costura');
                      setCopied('alias');
                      setTimeout(() => setCopied(''), 2000);
                    }}
                    className="flex items-center gap-1.5 text-[#7A9E7E] hover:text-[#5E8262] font-semibold text-xs bg-[#F9F5F0] hover:bg-[#EDE4D6] px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {copied === 'alias' ? '¡Copiado!' : '📋 Copiar'}
                  </button>
                </div>
              </div>

              <p><strong>2) Hacé clic en "Solicitar acceso"</strong> debajo para registrar tu pedido en la plataforma.</p>
            </div>

            <div className="bg-[#FFF4E5] border border-[#F3CAA8] rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-[#A85B24] mb-2 text-sm uppercase">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>
                Importante
              </div>
              <p className="text-sm text-[#874A1D] leading-relaxed">
                Una vez abonado el curso, <strong>deberás enviarle el comprobante a Daiana por WhatsApp</strong>. Sólo mediante ese paso podremos confirmar tu pago y darte de alta en el sistema para habilitar tus videoclases.
              </p>
            </div>

            <button
              onClick={handleRequestPurchase}
              className="w-full bg-[#7A9E7E] text-white py-3 rounded-xl font-semibold hover:bg-[#5E8262] transition-colors"
            >
              Solicitar acceso
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


