import { useState } from 'react';
import { groupCommentsByParent } from '../../utils/commentTree';
import { getImageUrl } from '../../utils/media';
import ImagePicker from '../ImagePicker';

// Bloque de preguntas a la profesora dentro de una lección del curso
// (vista alumna). Recibe el estado de useLessonComments resuelto por el padre.
// Las respuestas de un hilo (parentId) se muestran anidadas bajo su pregunta,
// y la alumna también puede responder (botón "Responder" con textarea inline).
// onSend acepta (lessonId, message, parentId?, imageFile?) — las props del
// componente no cambian.
export default function LessonCommentsSection({ lessonId, comments, draft, sendingFor, onSend, onDraftChange }) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [replyImage, setReplyImage] = useState(null);
  const [replyPreview, setReplyPreview] = useState('');
  const [mainImage, setMainImage] = useState(null);
  const [mainPreview, setMainPreview] = useState('');

  const { childrenOf, topLevel } = groupCommentsByParent(comments?.items);

  const pickImage = (setImage, setPreview) => (file) => {
    setImage(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return file || null;
    });
    setPreview(file ? URL.createObjectURL(file) : '');
  };

  const handleReplyImageChange = pickImage(setReplyImage, setReplyPreview);
  const handleMainImageChange = pickImage(setMainImage, setMainPreview);

  const clearReplyImage = () => {
    setReplyImage(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setReplyPreview('');
  };

  const clearMainImage = () => {
    setMainImage(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setMainPreview('');
  };

  const handleReplySend = async (commentId) => {
    const ok = await onSend(lessonId, replyDraft, commentId, replyImage);
    if (ok) {
      setReplyDraft('');
      clearReplyImage();
      setReplyingTo(null);
    }
  };

  const renderComment = (c, depth) => {
    const replies = childrenOf.get(c.id) || [];
    const isAdmin = c.user?.role === 'ADMIN';
    const isReplying = replyingTo === c.id;

    return (
      <div key={c.id} className={depth > 0 ? 'ml-4 sm:ml-8 border-l-2 border-border-sage pl-3 mt-2' : 'mt-0'}>
        <div className={`rounded-xl p-3 border text-sm ${isAdmin ? 'bg-white border-border' : 'bg-white border-border-sage'}`}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-bold uppercase tracking-wide text-accent">
              {isAdmin ? 'Profesora' : 'Vos'}
            </p>
            <p className="text-[11px] text-accent/70">{c.user?.name}</p>
          </div>
          <p className="text-text-ink leading-relaxed">{c.message}</p>
          {c.image && (
            <a href={getImageUrl(c.image)} target="_blank" rel="noreferrer" className="block w-fit" title="Abrir imagen">
              <img
                src={getImageUrl(c.image)}
                alt="Imagen adjunta"
                className="mt-2 rounded-lg border border-border max-h-64 w-auto cursor-pointer"
              />
            </a>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            if (isReplying) {
              setReplyingTo(null);
              clearReplyImage();
            } else {
              setReplyingTo(c.id);
              setReplyDraft('');
              clearReplyImage();
            }
          }}
          className="text-xs text-primary hover:text-primary-hover mt-1"
        >
          {isReplying ? 'Cancelar' : 'Responder'}
        </button>

        {isReplying && (
          <div className="mt-1 space-y-2">
            <div className="flex gap-2">
              <textarea
                value={replyDraft}
                onChange={e => setReplyDraft(e.target.value)}
                rows={1}
                placeholder="Escribí tu respuesta..."
                className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
              <button
                type="button"
                onClick={() => handleReplySend(c.id)}
                disabled={sendingFor === lessonId}
                className="btn btn-primary text-sm font-semibold self-start"
              >
                Enviar
              </button>
            </div>
            <ImagePicker preview={replyPreview} onPick={handleReplyImageChange} onRemove={clearReplyImage} />
          </div>
        )}

        {replies.map(r => renderComment(r, depth + 1))}
      </div>
    );
  };

  return (
    <div className="card-glow rounded-2xl p-4 lg:p-5">
      <h4 className="font-bold text-text-ink text-sm mb-3">Preguntas sobre esta lección</h4>

      {comments?.loading && (
        <p className="text-sm text-accent">Cargando...</p>
      )}

      {comments?.loaded && comments.items.length === 0 && (
        <p className="text-sm text-accent mb-3">Todavía no hay preguntas en esta lección. La profesora va a responder acá cuando dejes la tuya.</p>
      )}

      {comments?.loaded && comments.items.length > 0 && (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1 mb-3">
          {topLevel.map(c => renderComment(c, 0))}
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
          placeholder="Escribí tu duda sobre esta lección..."
          className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-secondary/30"
        />
        <ImagePicker preview={mainPreview} onPick={handleMainImageChange} onRemove={clearMainImage} />
        <button
          type="submit"
          disabled={sendingFor === lessonId}
          className="btn btn-primary text-sm font-semibold"
        >
          {sendingFor === lessonId ? 'Enviando...' : 'Enviar pregunta'}
        </button>
      </form>
    </div>
  );
}