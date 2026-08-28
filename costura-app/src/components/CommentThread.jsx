import { useState } from 'react';
import { groupCommentsByParent } from '../utils/commentTree';
import { getImageUrl } from '../utils/media';
import ImagePicker from './ImagePicker';

// Árbol de comentarios recursivo + formulario de respuesta inline, compartido
// entre la vista alumna (LessonCommentsSection) y la bandeja del admin
// (ConsultasSection). No hay chrome condicional por llamador: cada llamador
// pasa sus labels/badges vía `labels` y mantiene sus filtros/encabezados.
//
// Contrato:
// - `items` es la lista plana de comentarios (preguntas + respuestas) de la
//   lección; acá se arma el árbol con groupCommentsByParent.
// - `labels` = { admin, author, date, reply, cancel, send, placeholder,
//   badge? } donde `author` puede ser string o (comment) => node y `badge`
//   es un slot opcional renderizado por el llamador (ej. "Respondida").
// - `onReply(comment, message, imageFile)` se dispara solo cuando el mensaje
//   recortado no está vacío; devuelve true/false según el envío haya sido
//   exitoso (true limpia el draft y cierra el formulario).
// - `canReply` habilita/oculta los controles de respuesta; `replySending`
//   deshabilita el botón Enviar durante el envío.
// - `image` (opcional) = { preview, onChange, onRemove } controla el
//   ImagePicker: el llamador conserva el preview y el File elegido.
export default function CommentThread({
  items,
  onReply,
  labels = {},
  canReply = true,
  replySending = false,
  image,
}) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [replyImage, setReplyImage] = useState(null); // File para onReply

  const { childrenOf, topLevel } = groupCommentsByParent(items);
  const { admin, author, date, reply, cancel, send, placeholder, badge } = labels;

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleImageChange = (file) => {
    setReplyImage(file || null);
    if (image?.onChange) image.onChange(file);
  };

  const clearImage = () => {
    setReplyImage(null);
    if (image?.onRemove) image.onRemove();
  };

  const handleReplySend = async (comment) => {
    const msg = replyDraft.trim();
    if (!msg) return;
    const ok = await onReply(comment, msg, replyImage);
    if (ok) {
      setReplyDraft('');
      clearImage();
      setReplyingTo(null);
    }
  };

  const renderRow = (c, depth) => {
    const isAdmin = c.user?.role === 'ADMIN';
    const isReplying = replyingTo === c.id;
    const replies = childrenOf.get(c.id) || [];
    const authorLabel = isAdmin ? admin : (typeof author === 'function' ? author(c) : author);

    return (
      <div key={c.id} className={depth > 0 ? 'ml-4 sm:ml-8 border-l-2 border-border-sage pl-3 mt-2' : 'mt-0'}>
        <div className={`rounded-xl p-3 border text-sm ${isAdmin ? 'bg-white border-border' : 'bg-white border-border-sage'}`}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-bold uppercase tracking-wide text-accent">{authorLabel}</p>
            <div className="flex items-center gap-2">
              {typeof badge === 'function' && badge(c)}
              {date ? (
                <p className="text-[11px] text-accent/70">{formatDate(c.createdAt)}</p>
              ) : (
                <p className="text-[11px] text-accent/70">{c.user?.name}</p>
              )}
            </div>
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

        {canReply && (
          <>
            <button
              type="button"
              onClick={() => {
                if (isReplying) {
                  setReplyingTo(null);
                  clearImage();
                } else {
                  setReplyingTo(c.id);
                  setReplyDraft('');
                  clearImage();
                }
              }}
              className="text-xs text-primary hover:text-primary-hover mt-1 cursor-pointer"
            >
              {isReplying ? cancel : reply}
            </button>
            {isReplying && (
              <div className="mt-1 space-y-2">
                <div className="flex gap-2">
                  <textarea
                    value={replyDraft}
                    onChange={e => setReplyDraft(e.target.value)}
                    rows={1}
                    placeholder={placeholder}
                    className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                  <button
                    type="button"
                    onClick={() => handleReplySend(c)}
                    disabled={replySending}
                    className="btn btn-primary text-sm font-semibold self-start"
                  >
                    {send}
                  </button>
                </div>
                {image && <ImagePicker preview={image.preview} onPick={handleImageChange} onRemove={clearImage} />}
              </div>
            )}
          </>
        )}

        {replies.map(r => renderRow(r, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {topLevel.map(c => renderRow(c, 0))}
    </div>
  );
}