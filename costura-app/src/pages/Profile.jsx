import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CoursesContext';
import { courses } from '../data/courses';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { purchases } = useCourses();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [saved, setSaved] = useState(false);

  const myCourses = courses.filter(c => purchases.includes(c.id));

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    updateUser({ name: form.name.trim(), email: form.email });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F9F5F0]">
      <div className="bg-[#7A9E7E] py-12 px-4 animate-fade-up">
        <div className="max-w-3xl mx-auto flex items-center gap-5">
          <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center text-2xl font-bold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
            <p className="text-[#D4E8D4] text-sm">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fade-up-delay-1">
        <div className="bg-white rounded-2xl shadow-sm border border-[#EDE4D6] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#3D2B1F]">Información personal</h2>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-[#C4785A] text-sm hover:text-[#A85E42] font-medium">
                Editar
              </button>
            )}
          </div>

          {saved && (
            <div className="bg-[#EAF0EA] border border-[#7A9E7E] text-[#5E8262] text-sm rounded-xl px-4 py-3 mb-4">
              ✓ Cambios guardados correctamente
            </div>
          )}

          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Nombre</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-[#F9F5F0]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-[#F9F5F0]"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="bg-[#7A9E7E] text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-[#5E8262] transition-colors">
                  Guardar cambios
                </button>
                <button type="button" onClick={() => { setEditing(false); setForm({ name: user.name, email: user.email }); }} className="text-[#A08060] text-sm hover:text-[#6B4C3B]">
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[#A08060] text-sm w-16">Nombre</span>
                <span className="text-[#3D2B1F] font-medium">{user?.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#A08060] text-sm w-16">Email</span>
                <span className="text-[#3D2B1F] font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#A08060] text-sm w-16">Miembro</span>
                <span className="text-[#3D2B1F] font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#EDE4D6] p-6">
          <h2 className="font-bold text-[#3D2B1F] mb-5">Historial de compras</h2>
          {myCourses.length === 0 ? (
            <p className="text-[#A08060] text-sm">Todavía no realizaste ninguna compra.</p>
          ) : (
            <div className="space-y-3">
              {myCourses.map(course => (
                <div key={course.id} className="flex items-center gap-4 py-3 border-b border-[#F5EFE6] last:border-0">
                  <img src={course.image} alt={course.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#3D2B1F] text-sm truncate">{course.title}</p>
                    <p className="text-[#A08060] text-xs">{course.level}</p>
                  </div>
                  <span className="font-semibold text-[#3D2B1F] text-sm flex-shrink-0">${course.price.toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-2 flex justify-between text-sm font-semibold text-[#3D2B1F]">
                <span>Total invertido</span>
                <span>${myCourses.reduce((sum, c) => sum + c.price, 0).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
