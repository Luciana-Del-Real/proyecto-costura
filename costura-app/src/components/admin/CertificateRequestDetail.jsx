import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getImageUrl } from '../../utils/media';
import LoadingState from '../LoadingState';
import ErrorState from '../ErrorState';
import Badge from '../Badge';

// Detalle de una solicitud de certificado para la revisión del admin: alumna +
// curso y cada lección con su estado y su evidencia (imagen + nota). Se abre
// como modal y pide el detalle a GET /admin/certificate-requests/:id/detail al
// montarse. Los comentarios de la alumna NO se muestran acá a propósito: esta
// vista es solo para corroborar las evidencias.
export default function CertificateRequestDetail({ requestId, getDetail, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDetail(requestId)
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error('Error cargando el detalle de la solicitud:', e);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [requestId, getDetail]);

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return createPortal(
    <div className="fixed inset-0 animate-fade-in" style={{ zIndex: 100 }} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" onClick={onClose} />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-4"
        style={{ maxHeight: '90vh' }}
      >
        <div
          className="rounded-2xl border border-border bg-white w-full shadow-[0_12px_40px_rgba(29,29,27,0.15)] animate-fade-up"
          style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}
        >
          <div className="h-1 bg-primary flex-shrink-0" aria-hidden="true" />

          <div className="p-6 pb-4 flex-shrink-0 border-b border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-display font-bold text-2xl text-text-ink truncate">
                  {detail?.student?.name || 'Alumna'}
                </h3>
                <p className="text-sm text-text-ink opacity-70 truncate">{detail?.student?.email}</p>
                <p className="text-sm text-accent truncate mt-0.5">{detail?.course?.title}</p>
                {detail?.request?.createdAt && (
                  <p className="text-xs text-accent/70 mt-0.5">Solicitado el {formatDate(detail.request.createdAt)}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="btn btn-icon text-xl leading-none text-text-tan hover:text-text-ink shrink-0"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-6" style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto' }}>
            {loading && <LoadingState size="inline" />}
            {!loading && error && (
              <ErrorState variant="inline" description="No se pudo cargar el detalle de la solicitud." />
            )}

            {!loading && !error && detail && (
              <>
                <section className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary mb-3">Lecciones y evidencia</p>
                  {(!detail.lessons || detail.lessons.length === 0) && (
                    <p className="text-sm text-text-ink">Este curso no tiene lecciones.</p>
                  )}
                  <div className="space-y-3">
                    {(detail.lessons || []).map((lesson) => (
                      <div key={lesson.id} className="rounded-xl border border-border p-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge tone={lesson.completed ? 'success' : 'primary'}>
                            {lesson.completed ? 'Completada' : 'Pendiente'}
                          </Badge>
                          <span className="text-sm font-medium text-text-ink">{lesson.order}. {lesson.title}</span>
                        </div>
                        {lesson.evidenceImage ? (
                          <a href={getImageUrl(lesson.evidenceImage)} target="_blank" rel="noreferrer" className="block w-fit">
                            <img
                              src={getImageUrl(lesson.evidenceImage)}
                              alt={`Evidencia de ${lesson.title}`}
                              className="mt-2 max-h-48 rounded-lg border border-border object-contain"
                            />
                          </a>
                        ) : lesson.completed ? (
                          <p className="text-xs text-accent mt-1">Sin imagen de evidencia (completada antes del cambio).</p>
                        ) : null}
                        {lesson.evidenceNote && (
                          <p className="text-sm text-text-ink whitespace-pre-line mt-2">{lesson.evidenceNote}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
