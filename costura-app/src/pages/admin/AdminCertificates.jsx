import PageHeader from '../../components/PageHeader';
import CertificadosSection from '../../components/admin/CertificadosSection';
import useHighlightTarget from '../../hooks/useHighlightTarget';

// Página de certificados del admin: la alumna pide el certificado al
// completar el curso, la profesora lo arma y lo envía por mail fuera de la
// app, y acá lo marca como enviado (PENDING -> SENT).
export default function AdminCertificates() {
  // Al llegar desde la campanita (?highlight=<id>), scrollear hasta la
  // solicitud y marcarla en gris unos segundos.
  useHighlightTarget();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <PageHeader title="Certificados" subtitle="Solicitudes de certificado de tus alumnas." />
      <CertificadosSection />
    </div>
  );
}