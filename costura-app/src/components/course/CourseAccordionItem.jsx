import { BookOpen, GraduationCap } from 'lucide-react';
import { getLevelLabel } from '../../utils/levels';
import CourseCover from '../CourseCover';
import CourseWelcomePanel from './CourseWelcomePanel';

// Fila principal del acordeón de lecciones (vista alumna, mobile): muestra la
// portada del curso con su nombre y nivel. Al abrirse (por defecto) despliega
// el panel de bienvenida completo (portada grande, descripción, progreso y
// material del curso). Es excluyente con las lecciones: abrir una lección la
// cierra, y viceversa.
export default function CourseAccordionItem({
  course, prog, completedCount, downloadingCert, onDownloadCertificate, courseAttachments,
  isOpen, onToggle,
}) {
  return (
    <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-colors ${isOpen ? 'border-secondary' : 'border-border'}`}>
      {/* Cabecera del curso */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 lg:p-5 text-left hover:bg-bg-soft/60 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
          <CourseCover course={course} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-ink truncate">{course.title}</p>
          <p className="text-xs text-accent mt-0.5 flex items-center gap-1.5">
            <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" strokeWidth={1.5} /> {getLevelLabel(course.level)}</span>
            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} /> {course.lessons.length} lecciones</span>
          </p>
        </div>
        <span className={`text-text-ink transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* Contenido del curso, solo si está abierta */}
      {isOpen && (
        <div className="border-t border-border">
          <CourseWelcomePanel
            embedded
            course={course}
            prog={prog}
            completedCount={completedCount}
            downloadingCert={downloadingCert}
            onDownloadCertificate={onDownloadCertificate}
            courseAttachments={courseAttachments}
          />
        </div>
      )}
    </div>
  );
}