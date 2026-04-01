import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courses } from '../data/courses';
import { useCourses } from '../context/CoursesContext';

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buyCourse, hasCourse } = useCourses();
  const course = courses.find(c => c.id === Number(id));
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      buyCourse(course.id);
      setSuccess(true);
      setLoading(false);
      setTimeout(() => navigate('/mis-cursos'), 2000);
    }, 1500);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F5F0] px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-[#3D2B1F] mb-2">¡Compra exitosa!</h2>
          <p className="text-[#A08060]">Redirigiendo a tus cursos...</p>
        </div>
      </div>
    );
  }

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
            <h2 className="font-bold text-[#3D2B1F] text-lg mb-4">Datos de pago</h2>
            <div className="bg-[#F5EFE6] border border-[#EDE4D6] rounded-xl px-4 py-3 mb-5 text-sm text-[#6B4C3B]">
              🔒 Simulación de pago — no se procesará ningún cobro real
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Número de tarjeta</label>
                <input type="text" required maxLength={19} value={card.number}
                  onChange={e => setCard({ ...card, number: e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim() })}
                  className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-[#F9F5F0]"
                  placeholder="1234 5678 9012 3456" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Nombre en la tarjeta</label>
                <input type="text" required value={card.name}
                  onChange={e => setCard({ ...card, name: e.target.value })}
                  className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-[#F9F5F0]"
                  placeholder="NOMBRE APELLIDO" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Vencimiento</label>
                  <input type="text" required maxLength={5} value={card.expiry}
                    onChange={e => setCard({ ...card, expiry: e.target.value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1/$2') })}
                    className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-[#F9F5F0]"
                    placeholder="MM/AA" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">CVV</label>
                  <input type="text" required maxLength={4} value={card.cvv}
                    onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })}
                    className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-[#F9F5F0]"
                    placeholder="123" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#C4785A] text-white py-3.5 rounded-xl font-semibold hover:bg-[#A85E42] transition-colors disabled:opacity-60 mt-2">
                {loading ? 'Procesando...' : `Confirmar compra — $${course.price.toLocaleString()}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
