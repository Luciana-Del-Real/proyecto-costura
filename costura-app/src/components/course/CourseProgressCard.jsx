// Tarjeta de progreso del curso en la vista de aprendizaje: porcentaje, barra
// de avance y solicitud del certificado cuando se completa el 100%. El
// certificado NO se descarga acá: se solicita y la profesora lo envía por
// mail fuera de la app (estado PENDING -> SENT).
export default function CourseProgressCard({ prog, completedCount, total, certStatus, requestingCert, onRequestCertificate }) {
  const showRequestArea = prog === 100;
  return (
    <div className="min-w-[220px] card-flat rounded-2xl p-4">
      <div className="flex items-center justify-between text-sm text-text-ink mb-2">
        <span>Progreso del curso</span>
        <span className="font-bold text-primary">{prog}%</span>
      </div>
      <div className="w-full bg-white rounded-full h-2 overflow-hidden">
        <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${prog}%` }} />
      </div>
      <p className="text-xs text-accent mt-2">{completedCount}/{total} lecciones finalizadas</p>
      {showRequestArea && (
        <div className="mt-3">
          {certStatus === 'SENT' ? (
            <div className="text-center">
              <p className="text-xs font-bold text-success">✓ Certificado enviado</p>
              <p className="text-xs text-text-ink opacity-70 mt-1">Revisá tu mail</p>
            </div>
          ) : certStatus === 'PENDING' ? (
            <div className="text-center">
              <p className="text-xs font-bold text-primary">Solicitud enviada</p>
              <p className="text-xs text-text-ink opacity-70 mt-1">Te lo enviamos por mail cuando esté listo</p>
            </div>
          ) : (
            <button
              onClick={onRequestCertificate}
              disabled={requestingCert}
              className="btn btn-primary w-full text-sm font-semibold"
            >
              {requestingCert ? 'Enviando...' : '🎓 Solicitar certificado'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}