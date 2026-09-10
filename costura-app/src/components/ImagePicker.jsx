import { useTranslation } from 'react-i18next';

// Selector de imagen chico para adjuntar a una pregunta/respuesta de una
// consulta: botón "Adjuntar imagen" (📷) + thumbnail de preview con botón de
// quitar. El padre guarda el File (para el FormData) y la URL del preview.
export default function ImagePicker({ preview, onPick, onRemove }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-accent hover:text-primary">
        <span aria-hidden="true">📷</span> {t('imagePicker.attach')}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onPick(e.target.files?.[0] || null)}
          className="hidden"
        />
      </label>
      {preview && (
        <span className="inline-flex items-center gap-1.5">
          <img
            src={preview}
            alt={t('imagePicker.previewAlt')}
            className="h-10 w-10 rounded-lg border border-border object-cover"
          />
          <button
            type="button"
            onClick={onRemove}
            aria-label={t('imagePicker.remove')}
            className="text-sm font-bold text-danger hover:text-danger/70"
          >
            ×
          </button>
        </span>
      )}
    </div>
  );
}