import { useState, useEffect, useCallback } from 'react';
import { useCourses } from '../../context/CoursesContext';
import { getCoursePrice, getCurrencyCode } from '../../utils/currency';
import { getImageUrl } from '../../utils/media';

export default function AdminUsers() {
  const { courses, getAllUsers, toggleUserActive } = useCourses();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null); // { user, action }
  const [search, setSearch] = useState('');

  const refreshUsers = useCallback(async () => {
    try {
      const data = await getAllUsers();
      setAllUsers(data);
    } catch (err) {
      console.error('Error cargando alumnas:', err);
    } finally {
      setLoading(false);
    }
  }, [getAllUsers]);

  useEffect(() => { refreshUsers(); }, [refreshUsers]);

  const handleToggle = async () => {
    try {
      await toggleUserActive(confirmToggle.user.id);
      await refreshUsers();
      if (selected?.id === confirmToggle.user.id) {
        setSelected(prev => ({ ...prev, active: prev.active === false ? true : false }));
      }
    } catch (err) {
      console.error(err);
      alert('No se pudo actualizar el estado de la cuenta');
    } finally {
      setConfirmToggle(null);
    }
  };

  const filtered = allUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // user.purchases viene del backend como [{ courseId }, ...]
  const getPurchasedCourseIds = (user) => (user.purchases || []).map(p => p.courseId);
  const getUserCourses = (user) => {
    const ids = getPurchasedCourseIds(user);
    return courses.filter(c => ids.includes(c.id));
  };

  // user.progress viene del backend como [{ lessonId }, ...] (solo lecciones completadas)
  const getProgress = (user, course) => {
    const totalLessons = course.lessons?.length || 0;
    if (totalLessons === 0) return 0;
    const courseLessonIds = course.lessons.map(l => l.id);
    const completedCount = (user.progress || []).filter(p => courseLessonIds.includes(p.lessonId)).length;
    return Math.round((completedCount / totalLessons) * 100);
  };

  const isActive = (u) => u.active !== false;

  if (loading) {
    return <div className="min-h-screen bg-[#F9F5F0] flex items-center justify-center"><span className="text-4xl">🧵</span></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      <div className="bg-[#F9F5F0] rounded-2xl shadow-sm border border-gray-100 px-4 py-10 animate-fade-up mt-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-[#6B4C3B]">Alumnos</h1>
          <p className="text-[#A08060] text-sm mt-0.5">{allUsers.length} alumna{allUsers.length !== 1 ? 's' : ''} registrada{allUsers.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in mt-4 mb-5">
        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A08060]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alumna..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-grey bg-[#F9F5F0] shadow-sm border border-gray-100 animate-fade-up" />
        </div>

        {/* Confirm toggle modal */}
        {confirmToggle && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] animate-fade-in px-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-fade-up justify-center text-center font-medium">
              <h3 className="font-medium text-[#3D2B1F] mb-2">
                {confirmToggle.action === 'deactivate' ? '¿Dar de baja a esta alumna?' : '¿Reactivar esta cuenta?'}
              </h3>
              <p className="text-[#A08060] text-sm mb-5">
                {confirmToggle.action === 'deactivate'
                  ? 'La alumna no podrá iniciar sesión hasta que se reactive su cuenta.'
                  : 'La alumna podrá volver a iniciar sesión normalmente.'}
              </p>
              <div className="flex justify-center items-center gap-3">
                <button onClick={handleToggle}
                  className={`text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    confirmToggle.action === 'deactivate'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-[#7A9E7E] hover:bg-[#5E8262]'
                  }`}>
                  {confirmToggle.action === 'deactivate' ? 'Dar de baja' : 'Reactivar'}
                </button>
                <button onClick={() => setConfirmToggle(null)} className=" font-medium text-white text-sm hover:text-[#6B4C3B]">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Detail modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 animate-fade-in px-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl animate-fade-up max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isActive(selected) ? 'bg-[#EAF0EA] text-[#5E8262]' : 'bg-red-50 text-red-400'}`}>
                    {selected.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-xl text-[#3D2B1F]">{selected.name}</h3>
                      {!isActive(selected) && (
                        <span className="text-xs bg-red-50 text-red-400 border border-red-200 px-2 py-0.5 rounded-full">Suspendida</span>
                      )}
                    </div>
                    <p className="text-[#A08060] text-xs">{selected.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-white hover:text-[#6B4C3B] text-xl leading-none">×</button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-[#F9F5F0] rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-[#3D2B1F]">{getPurchasedCourseIds(selected).length}</p>
                  <p className="text-xs text-[#A08060]">Cursos comprados</p>
                </div>
                <div className="bg-[#F9F5F0] rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-[#3D2B1F]">
                    ${getUserCourses(selected).reduce((s, c) => s + getCoursePrice(c, selected), 0).toLocaleString()} {getCurrencyCode(selected)}
                  </p>
                  <p className="text-xs text-[#A08060]">Total invertido</p>
                </div>
              </div>

              <h4 className="font-semibold text-[#3D2B1F] text-sm mb-3">Cursos y progreso</h4>
              {getUserCourses(selected).length === 0 ? (
                <p className="text-[#A08060] text-sm mb-5">Sin cursos aún.</p>
              ) : (
                <div className="space-y-3 mb-5">
                  {getUserCourses(selected).map(course => {
                    const prog = getProgress(selected, course);
                    return (
                      <div key={course.id} className="flex items-center gap-3">
                        <img src={getImageUrl(course.image)} alt={course.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#3D2B1F] truncate">{course.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-[#EDE4D6] rounded-full h-1.5">
                              <div className="bg-[#7A9E7E] h-1.5 rounded-full" style={{ width: `${prog}%` }} />
                            </div>
                            <span className="text-xs text-[#A08060] flex-shrink-0">{prog}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-xs text-[#A08060] mb-5">
                Registrada el {new Date(selected.createdAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              {/* Action button */}
              <div className="border-t border-[#F5EFE6] pt-4">
                {isActive(selected) ? (
                  <button
                    onClick={() => setConfirmToggle({ user: selected, action: 'deactivate' })}
                    className="w-full text-center text-sm text-red-500 border border-red-200 py-2.5 rounded-xl transition-colors font-medium">
                    Dar de baja esta cuenta
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmToggle({ user: selected, action: 'activate' })}
                    className="w-full text-center text-sm text-red-500 border border-red-200 py-2.5 rounded-xl transition-colors font-medium">
                    Reactivar esta cuenta
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#A08060] mt-4">{allUsers.length === 0 ? 'Sin alumnos registrados aún.' : 'No se encontraron resultados.'}</p>
          </div>
        ) : (
          <div className="bg-[#F9F5F0] rounded-2xl shadow-sm border border-[#E5E0D8] overflow-hidden animate-fade-up">
            <table className="w-full text-sm">
              <thead>
                {/* Eliminamos el fondo del tr y dejamos que el bg del div principal sea el fondo */}
                <tr className="border-b border-[#E5E0D8]">
                  <th className="text-left px-8 py-4 text-[#6B4C3B] font-bold text-xs uppercase tracking-wider">Alumna</th>
                  <th className="text-left px-4 py-4 text-[#6B4C3B] font-bold text-xs uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="text-center px-4 py-4 text-[#6B4C3B] font-bold text-xs uppercase tracking-wider">Cursos</th>
                  <th className="text-center px-4 py-4 text-[#6B4C3B] font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Estado</th>
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D8]">
                {filtered.map((u) => (
                  <tr key={u.id} className={`transition-colors ${isActive(u) ? 'hover:bg-[#F2EDE7]' : 'bg-red-50/30 hover:bg-red-50/50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isActive(u) ? 'bg-[#E5EADD] text-[#5E8262]' : 'bg-red-100 text-red-400'}`}>
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className={`font-semibold ${isActive(u) ? 'text-[#3D2B1F]' : 'text-[#A08060]'}`}>{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-black hidden md:table-cell font-medium">{u.email}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="bg-[#E5E0D8] text-[#6B4C3B] text-xs font-bold px-3 py-1 rounded-full">{getPurchasedCourseIds(u).length}</span>
                    </td>
                    <td className="px-4 py-4 text-center hidden sm:table-cell">
                      {isActive(u)
                        ? <span className="text-[10px] font-bold uppercase tracking-wide bg-[#E5EADD] text-[#5E8262] px-2 py-1 rounded-full">Activa</span>
                        : <span className="text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-400 px-2 py-1 rounded-full">Suspendida</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelected(u)} 
                        className="bg-[#4E6D5B] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#3d5a4a] transition-all shadow-sm"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
