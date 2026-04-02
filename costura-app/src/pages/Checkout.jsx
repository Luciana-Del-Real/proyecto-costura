import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courses } from '../data/courses';
import { useCourses } from '../context/CoursesContext';

export default function Checkout() {
  const { id } = useParams();
  const { hasCourse, isPending, requestPurchase } = useCourses();
  const course = courses.find(c => c.id === Number(id));
  const [requested, setRequested] = useState(false);

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F5F0] px-4">
        <div className="text-center">
          <span className="text-5xl">⏳</span>
          <h2 className="text-xl font-bold text-[#3D2B1F] mt-4">Solicitud de compra enviada</h2>
          <p className="text-[#A08060] mt-2">Tu comprobante está en revisión por el admin. Te notificaremos cuando se confirme.</p>
          <Link to="/mis-cursos" className="mt-4 inline-block bg-[#7A9E7E] text-white px-6 py-2.5 rounded-xl hover:bg-[#5E8262] transition-colors">
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
            <div className="bg-[#F5EFE6] border border-[#EDE4D6] rounded-xl px-4 py-3 mb-5 text-sm text-[#6B4C3B]">
              1) Transferí a cuenta: CVU 0000000000000000000000 · Alias: grow.costura
              <br />
              2) Enviá el comprobante por WhatsApp al admin: +54 9 11 1234 5678
              <br />
              3) El admin verifica y habilita tu acceso desde el panel.
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


