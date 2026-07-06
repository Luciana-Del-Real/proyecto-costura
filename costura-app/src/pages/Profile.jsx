import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CoursesContext';
import { courses } from '../data/courses';
import { getImageUrl } from '../utils/media';

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
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      <div className="bg-[#F4F1ED] rounded-2xl shadow-sm border border-gray-100 px-4 py-10 animate-fade-up mt-5 mb-5 flex justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-[#E5EADD] rounded-full flex items-center justify-center text-2xl font-bold text-text-[#6B4C3B]">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#6B4C3B]">{user?.name}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
        <div className="bg-[#F4F1ED] rounded-2xl shadow-sm border border-gray-100 px-4 py-10 animate-fade-up mt-5 mb-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#6B4C3B] text-xl">Información personal</h2>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-theme text-sm font-medium">
                Editar
              </button>
            )}
          </div>

          {saved && (
            <div className="bg-soft border border-secondary text-secondary text-sm rounded-xl px-4 py-3 mb-4">
              ✓ Cambios guardados correctamente
            </div>
          )}

          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme mb-1.5">Nombre</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-theme rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-soft"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-theme rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-soft"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="bg-secondary text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-[#5E8262] transition-colors">
                  Guardar cambios
                </button>
                <button type="button" onClick={() => { setEditing(false); setForm({ name: user.name, email: user.email }); }} className="text-theme text-sm">
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-theme text-sm w-16">Nombre</span>
                <span className="text-theme font-medium">{user?.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-theme text-sm w-16">Email</span>
                <span className="text-theme font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-theme text-sm w-16">País</span>
                <span className="text-theme font-medium">{user?.country || 'No especificado'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#F4F1ED] rounded-2xl shadow-sm border border-gray-100 px-4 py-10 animate-fade-up mt-5 mb-5">
          <h2 className="font-bold text-[#6B4C3B] text-xl">Historial de compras</h2>
          {myCourses.length === 0 ? (
            <p className="text-theme text-sm">Todavía no realizaste ninguna compra.</p>
          ) : (
            <div className="space-y-3">
              {myCourses.map(course => (
                <div key={course.id} className="flex items-center gap-4 py-3 border-b border-theme last:border-0">
                  <img src={getImageUrl(course.image)} alt={course.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-theme text-sm truncate">{course.title}</p>
                    <p className="text-theme text-xs">{course.level}</p>
                  </div>
                  <span className="font-semibold text-theme text-sm flex-shrink-0">${course.priceARS.toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-2 flex justify-between text-sm font-semibold text-[#3D2B1F]">
                <span>Total invertido</span>
                <span>${myCourses.reduce((sum, c) => sum + c.priceARS, 0).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
