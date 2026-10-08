import { useState } from 'react';
import { Mail, MailCheck } from 'lucide-react';
import useCertificateRequests from '../../hooks/useCertificateRequests';
import { useDialog } from '../../context/DialogContext';
import CertificateRequestDetail from './CertificateRequestDetail';
import LoadingState from '../LoadingState';
import EmptyState from '../EmptyState';
import ErrorState from '../ErrorState';
import Badge from '../Badge';

// Bandeja de solicitudes de certificado del admin: la alumna pide el
// certificado al completar el curso, la profesora lo arma y lo envía por mail
// FUERA de la app, y acá marca la solicitud como enviada (PENDING -> SENT).
export default function CertificadosSection() {
  const { confirmDialog, alertDialog } = useDialog();
  const { pending, sent, loading, error, markSent, getDetail } = useCertificateRequests();
  const [sendingId, setSendingId] = useState(null);
  const [showSent, setShowSent] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleMarkSent = async (request) => {
    const ok = await confirmDialog(
      `¿Ya enviaste el certificado de ${request.user?.name || 'esta alumna'} por mail?`,
      'Marcar como enviada',
    );
    if (!ok) return;
    setSendingId(request.id);
    try {
      await markSent(request.id);
    } catch (e) {
      console.error(e);
      alertDialog('No se pudo marcar la solicitud como enviada. Probá de nuevo.');
    } finally {
      setSendingId(null);
    }
  };

  const renderRow = (r) => (
    <div key={r.id} id={r.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setSelectedId(r.id)}
        title="Ver lecciones, evidencia y comentarios"
        className="flex-1 min-w-0 text-left group"
      >
        <p className="text-sm font-medium text-text-ink truncate group-hover:text-primary">{r.user?.name || 'Alumna'}</p>
        <p className="text-xs text-text-ink opacity-70 truncate">{r.user?.email || 'Sin email'}</p>
        <p className="text-xs text-accent truncate mt-0.5">{r.course?.title || 'Curso sin título'}</p>
      </button>
      <div className="flex items-center gap-3 sm:flex-none">
        <span className="text-xs text-text-ink opacity-70 whitespace-nowrap">{formatDate(r.createdAt)}</span>
        {r.status === 'PENDING' ? (
          <Badge tone="primary" className="whitespace-nowrap">Pendiente</Badge>
        ) : (
          <Badge tone="success" className="whitespace-nowrap">Enviada</Badge>
        )}
        {r.status === 'PENDING' && (
          <button
            type="button"
            onClick={() => handleMarkSent(r)}
            disabled={sendingId === r.id}
            className="btn btn-ghost text-xs font-semibold flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
            {sendingId === r.id ? 'Guardando...' : 'Marcar como enviada'}
          </button>
        )}
        {r.status === 'SENT' && (
          <span className="flex items-center gap-1 text-xs text-success whitespace-nowrap">
            <MailCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
            {r.sentAt ? formatDate(r.sentAt) : 'Enviado'}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div id="certificados" className="card-flat rounded-xl p-6 mt-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <p className="text-sm text-text-ink">
          Cuando una alumna termina un curso y pide su certificado, aparece acá. Lo armás vos y se lo
          enviás por mail fuera de la app; después marcás la solicitud como enviada.
        </p>
        <span className="text-xs font-bold bg-primary-soft text-primary px-3 py-1 rounded-full shrink-0">
          {pending.length} pendiente{pending.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading && <LoadingState size="inline" />}
      {!loading && error && <ErrorState variant="inline" description="No se pudieron cargar las solicitudes." />}

      {!loading && !error && pending.length === 0 && sent.length === 0 && (
        <EmptyState variant="inline" title="Sin solicitudes todavía." />
      )}

      {!loading && !error && pending.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-bold uppercase tracking-wide text-primary mb-1">Pendientes</p>
          {pending.map(renderRow)}
        </div>
      )}

      {!loading && !error && sent.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowSent(s => !s)}
            className="text-sm text-primary hover:text-primary-hover font-medium mb-1"
          >
            {showSent ? '▾ Ocultar enviadas' : `▸ Ver enviadas (${sent.length})`}
          </button>
          {showSent && (
            <div className="mt-1">
              <p className="text-xs font-bold uppercase tracking-wide text-text-ink mb-1">Enviadas</p>
              {sent.map(renderRow)}
            </div>
          )}
        </div>
      )}

      {selectedId && (
        <CertificateRequestDetail
          key={selectedId}
          requestId={selectedId}
          getDetail={getDetail}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}