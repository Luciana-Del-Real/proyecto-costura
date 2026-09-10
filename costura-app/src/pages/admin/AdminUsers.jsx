import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import { useCourseCatalog } from '../../context/CourseCatalogContext';
import { useDialog } from '../../context/DialogContext';
import { useAdmin } from '../../context/AdminContext';
import { getCoursePrice, getCurrencyCode } from '../../utils/currency';
import { getImageUrl } from '../../utils/media';

export default function AdminUsers() {
  const { alertDialog, confirmDialog } = useDialog();
  const { courses } = useCourseCatalog();
  const { getAllUsers, toggleUserActive } = useAdmin();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

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

  const handleToggle = async (user, action) => {
    const message = action === 'deactivate'
      ? 'La alumna no podrá iniciar sesión hasta que se reactive su cuenta.'
      : 'La alumna podrá volver a iniciar sesión normalmente.';
    const title = action === 'deactivate' ? '¿Dar de baja a esta alumna?' : '¿Reactivar esta cuenta?';
    if (!await confirmDialog(message, title)) return;
    try {
      await toggleUserActive(user.id);
      await refreshUsers();
      if (selected?.id === user.id) {
        setSelected(prev => ({ ...prev, active: prev.active === false ? true : false }));
      }
    } catch (err) {
      console.error(err);
      alertDialog('No se pudo actualizar el estado de la cuenta');
    }
  };

  const filtered = allUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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
    return <div className="min-h-screen bg-bg-surface flex items-center justify-center"><span className="text-4xl">🧵</span></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      <PageHeader
        title="Alumnos"
        subtitle={`${allUsers.length} alumna${allUsers.length !== 1 ? 's' : ''} registrada${allUsers.length !== 1 ? 's' : ''}`}
      />

      {/* Search */}
        <div className="relative max-w-sm mb-6 mt-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar alumna..."
            className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-300 hover:border-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-300"
          />
        </div>

        {/* Detail modal — posicionamiento absoluto directo: centra el modal
            siempre respecto a la pantalla sin depender de flex/grid. */}
        {selected && (
          <div className="fixed inset-0 z-[100] animate-fade-in" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/30" aria-hidden="true" onClick={() => setSelected(null)} />
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg px-4"
              style={{ maxHeight: '90vh' }}
            >
              <div
                className="rounded-2xl border border-border bg-white w-full shadow-[0_12px_40px_rgba(29,29,27,0.15)] animate-fade-up"
                style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}
              >
              {/* Barra de acento fucsia, identidad Grow */}
              <div className="h-1 bg-primary flex-shrink-0" aria-hidden="true" />

              {/* Header con avatar grande (fijo) */}
              <div className="p-6 pb-4 flex-shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-display text-2xl font-bold ${isActive(selected) ? 'bg-primary-soft text-primary' : 'bg-red-50 text-red-400'}`}>
                      {selected.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-2xl text-text-ink">{selected.name}</h3>
                        {!isActive(selected) && (
                          <span className="text-xs bg-red-50 text-red-400 border border-red-200 px-2 py-0.5 rounded-full font-semibold">Suspendida</span>
                        )}
                      </div>
                      <p className="text-text-tan text-sm mt-0.5">{selected.email}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        Registrada el {new Date(selected.createdAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} aria-label="Cerrar" className="btn btn-icon text-xl leading-none text-text-tan hover:text-text-ink">×</button>
                </div>
              </div>

              {/* Cuerpo scrolleable (stats + cursos + acción) */}
              <div className="px-6 pb-6" style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto' }}>
                {/* Stats en dos tarjetas */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-bg-soft/40 rounded-xl px-4 py-3 border border-border/60">
                  <p className="text-[11px] uppercase tracking-wide text-text-tan font-bold">Cursos comprados</p>
                  <p className="text-2xl font-display font-bold text-text-ink mt-0.5">{getPurchasedCourseIds(selected).length}</p>
                </div>
                <div className="bg-bg-soft/40 rounded-xl px-4 py-3 border border-border/60">
                  <p className="text-[11px] uppercase tracking-wide text-text-tan font-bold">Total invertido</p>
                  <p className="text-2xl font-display font-bold text-text-ink mt-0.5">
                    ${getUserCourses(selected).reduce((s, c) => s + getCoursePrice(c, selected), 0).toLocaleString()} {getCurrencyCode(selected)}
                  </p>
                </div>
              </div>

              {/* Cursos y progreso */}
              <div>
                <h4 className="font-display font-bold text-text-ink text-2xl mb-4 border-b border-border pb-2">Cursos y progreso</h4>
                {getUserCourses(selected).length === 0 ? (
                  <p className="text-text-tan text-sm mb-5">Sin cursos aún.</p>
                ) : (
                  <div className="space-y-3 mb-5">
                    {getUserCourses(selected).map(course => {
                      const prog = getProgress(selected, course);
                      return (
                        <div key={course.id} className="flex items-center gap-3 bg-white border border-border rounded-xl p-3">
                          <img src={getImageUrl(course.image)} alt={course.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold text-text-ink truncate leading-snug">{course.title}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 bg-bg-soft rounded-full h-2">
                                <div className="bg-primary h-2 rounded-full" style={{ width: `${prog}%` }} />
                              </div>
                              <span className="text-sm font-bold text-text-ink flex-shrink-0">{prog}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Action button */}
                <div className="border-t border-bg-soft pt-4">
                  {isActive(selected) ? (
                    <button
                      onClick={() => handleToggle(selected, 'deactivate')}
                      className="btn btn-ghost w-full text-sm text-danger border-red-200">
                      Dar de baja esta cuenta
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggle(selected, 'activate')}
                      className="btn btn-ghost w-full text-sm text-danger border-red-200">
                      Reactivar esta cuenta
                    </button>
                  )}
                </div>
              </div>
            </div>
            </div>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16 mb-5">
            <p className="text-text-tan mt-4">{allUsers.length === 0 ? 'Sin alumnos registrados aún.' : 'No se encontraron resultados.'}</p>
          </div>
        ) : (
          <div className="card-flat rounded-2xl overflow-x-auto animate-fade-up mb-5">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                {/* Eliminamos el fondo del tr y dejamos que el bg del div principal sea el fondo */}
                <tr className="border-b border-border">
                  <th className="text-left px-8 py-4 text-text-ink font-bold text-xs uppercase tracking-wider">Alumna</th>
                  <th className="text-left px-4 py-4 text-text-ink font-bold text-xs uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="text-center px-4 py-4 text-text-ink font-bold text-xs uppercase tracking-wider">Cursos</th>
                  <th className="text-center px-4 py-4 text-text-ink font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Estado</th>
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageItems.map((u) => (
                  <tr key={u.id} className={`transition-colors ${isActive(u) ? 'hover:bg-black/5' : 'bg-red-50/30 hover:bg-red-50/50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isActive(u) ? 'bg-primary-soft text-success' : 'bg-red-100 text-red-400'}`}>
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className={`font-semibold ${isActive(u) ? 'text-text-ink' : 'text-text-tan'}`}>{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-black hidden md:table-cell font-medium">{u.email}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="bg-border text-text-ink text-xs font-bold px-3 py-1 rounded-full">{getPurchasedCourseIds(u).length}</span>
                    </td>
                    <td className="px-4 py-4 text-center hidden sm:table-cell">
                      {isActive(u)
                        ? <span className="text-[10px] font-bold uppercase tracking-wide bg-primary-soft text-success px-2 py-1 rounded-full">Activa</span>
                        : <span className="text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-400 px-2 py-1 rounded-full">Suspendida</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelected(u)} 
                        className="btn btn-primary text-xs shadow-sm"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />
          </div>
        )}
    </div>
  );
}
