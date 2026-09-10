import { useTranslation } from 'react-i18next';

// Tarjeta de progreso del curso en la vista de aprendizaje: porcentaje, barra
// de avance y descarga del certificado cuando se completa el 100%.
export default function CourseProgressCard({ prog, completedCount, total, downloadingCert, onDownloadCertificate }) {
  const { t } = useTranslation();

  return (
    <div className="min-w-[220px] card-flat rounded-2xl p-4">
      <div className="flex items-center justify-between text-sm text-text-ink mb-2">
        <span>{t('courseProgress.title')}</span>
        <span className="font-bold text-primary">{prog}%</span>
      </div>
      <div className="w-full bg-white rounded-full h-2 overflow-hidden">
        <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${prog}%` }} />
      </div>
      <p className="text-xs text-accent mt-2">{t('courseProgress.lessonsCompleted', { completed: completedCount, total })}</p>
      {prog === 100 && (
        <button
          onClick={onDownloadCertificate}
          disabled={downloadingCert}
          className="btn btn-primary w-full mt-3 text-sm font-semibold"
        >
          {downloadingCert ? t('courseProgress.generating') : t('courseProgress.downloadCertificate')}
        </button>
      )}
    </div>
  );
}