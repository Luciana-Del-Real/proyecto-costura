import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImagePicker from '../ImagePicker';
import CommentThread from '../CommentThread';

// Bloque de preguntas a la profesora dentro de una lección del curso
// (vista alumna). Recibe el estado de useLessonComments resuelto por el padre.
// Las respuestas de un hilo (parentId) se muestran anidadas bajo su pregunta,
// y la alumna también puede responder (botón "Responder" con textarea inline).
// El árbol de comentarios y el formulario de respuesta viven en CommentThread;
// acá quedan el composer principal, los estados de carga/vacío y las labels
// "Vos"/"Profesora". onSend acepta (lessonId, message, parentId?, imageFile?).
export default function LessonCommentsSection({ lessonId, comments, draft, sendingFor, onSend, onDraftChange }) {
  const { t } = useTranslation();
  const [replyPreview, setReplyPreview] = useState('');
  const [mainImage, setMainImage] = useState(null);
  const [mainPreview, setMainPreview] = useState('');

  const pickImage = (setImage, setPreview) => (file) => {
    setImage(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return file || null;
    });
    setPreview(file ? URL.createObjectURL(file) : '');
  };

  const handleReplyImageChange = (file) => {
    setReplyPreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : '';
    });
  };

  const handleMainImageChange = pickImage(setMainImage, setMainPreview);

  const clearReplyImage = () => {
    setReplyPreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
  };

  const clearMainImage = () => {
    setMainImage(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setMainPreview('');
  };

  const handleReplySend = async (comment, message, imageFile) => {
    return await onSend(lessonId, message, comment.id, imageFile);
  };

  const labels = {
    admin: t('comments.teacher'),
    author: t('comments.you'),
    reply: t('comments.reply'),
    cancel: t('comments.cancel'),
    send: t('comments.send'),
    placeholder: t('comments.replyPlaceholder'),
  };

  return (
    <div className="card-flat rounded-2xl p-4 lg:p-5">
      <h4 className="font-bold text-text-ink text-sm mb-3">{t('comments.questionsTitle')}</h4>

      {comments?.loading && (
        <p className="text-sm text-accent">{t('comments.loading')}</p>
      )}

      {comments?.loaded && comments.items.length === 0 && (
        <p className="text-sm text-accent mb-3">{t('comments.empty')}</p>
      )}

      {comments?.loaded && comments.items.length > 0 && (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1 mb-3">
          <CommentThread
            items={comments.items}
            onReply={handleReplySend}
            labels={labels}
            canReply
            replySending={sendingFor === lessonId}
            image={{ preview: replyPreview, onChange: handleReplyImageChange, onRemove: clearReplyImage }}
          />
        </div>
      )}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await onSend(lessonId, draft, undefined, mainImage);
          if (ok) clearMainImage();
        }}
        className="space-y-2"
      >
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(lessonId, e.target.value)}
          rows={2}
          placeholder={t('comments.askPlaceholder')}
          className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-secondary/30"
        />
        <ImagePicker preview={mainPreview} onPick={handleMainImageChange} onRemove={clearMainImage} />
        <button
          type="submit"
          disabled={sendingFor === lessonId}
          className="btn btn-primary text-sm font-semibold"
        >
          {sendingFor === lessonId ? t('comments.sending') : t('comments.ask')}
        </button>
      </form>
    </div>
  );
}