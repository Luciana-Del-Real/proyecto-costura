import { useEffect, useState } from 'react';
import { getImageUrl } from '../../utils/media';
import LoadingState from '../LoadingState';
import ErrorState from '../ErrorState';
import Badge from '../Badge';
import Modal from '../Modal';

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

  return (
    <Modal
      open
      onClose={onClose}
      title={detail?.student?.name || 'Alumna'}
      subtitle={detail?.student?.email}
      size="lg"
      zIndex={100}
    >
      <div>
        <p className="text-sm text-accent truncate">{detail?.course?.title}</p>
        {detail?.request?.createdAt && (
          <p className="text-xs text-accent/70 mt-0.5 mb-4">Solicitado el {formatDate(detail.request.createdAt)}</p>
        )}

        {loading && <LoadingState size="inline" />}
        {!loading && error && (
          <ErrorState variant="inline" description="No se pudo cargar el detalle de la solicitud." />
        )}

        {!loading && !error && detail && (
          <>
            <section>
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
    </Modal>
  );
}
