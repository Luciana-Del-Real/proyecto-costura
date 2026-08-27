import { BookOpen, GraduationCap, FileText } from 'lucide-react';
import { getImageUrl } from '../../utils/media';
import { getLevelLabel } from '../../utils/levels';
import CourseCover from '../CourseCover';
import CourseProgressCard from './CourseProgressCard';

// Panel de bienvenida del curso (portada + nombre + descripción + progreso +
// material general). Se muestra en el panel derecho del layout de dos paneles
// cuando todavía no se seleccionó ninguna lección, y en mobile arriba del
// acordeón. Al abrir una lección, este panel se reemplaza por su contenido.
export default function CourseWelcomePanel({
  course, prog, completedCount, downloadingCert, onDownloadCertificate, courseAttachments,
}) {
  return (
    <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
      {/* Portada: CourseCover muestra el nombre del curso si no hay imagen */}
      <CourseCover course={course} className="w-full h-48 lg:h-56 object-cover" />
      <div className="p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[240px]">
            <span className="text-xs font-semibold bg-bg-soft text-accent px-3 py-1 rounded-full">{getLevelLabel(course.level)}</span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-text-ink mt-3">{course.title}</h1>
            <p className="text-text-ink mt-2 max-w-2xl">{course.longDescription || course.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-text-ink mt-4">
              <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-accent" strokeWidth={1.5} /> {course.instructor}</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-accent" strokeWidth={1.5} /> {course.lessons.length} lecciones</span>
            </div>
          </div>
          <CourseProgressCard
            prog={prog}
            completedCount={completedCount}
            total={course.lessons.length}
            downloadingCert={downloadingCert}
            onDownloadCertificate={onDownloadCertificate}
          />
        </div>

        {/* PDFs generales del curso (no de una lección puntual) */}
        {courseAttachments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs uppercase tracking-wide text-accent mb-2">Material del curso</p>
            <div className="flex flex-wrap gap-2">
              {courseAttachments.map(att => (
                <a
                  key={att.id}
                  href={getImageUrl(att.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost text-sm flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" strokeWidth={1.5} /> {att.filename || 'Ver PDF'}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}