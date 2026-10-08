import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Modal from '../components/Modal';

const DialogContext = createContext(null);

// Modal de marca Grow que reemplaza los diálogos nativos del navegador
// (window.confirm / alert). Un solo diálogo a la vez:
// - confirmDialog(message, title?) -> Promise<boolean>; resuelve true solo si
//   la usuaria confirma explícitamente, false al cancelar. La X y Esc cierran
//   cancelando (resuelven false); el backdrop queda inerte para evitar
//   cancelaciones accidentales (decisión explícita requerida por un control,
//   no por un click casual).
// - alertDialog(message, title?) -> Promise<void>; se descarta con click en el
//   backdrop, con Esc, con la X o en "Entendido".
// El resolver vive en un ref para completar el Promise fuera del ciclo de
// render (el updater de setState no debe ejecutar side effects).
export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { type, title, message }
  const resolveRef = useRef(null);

  const openDialog = useCallback((type, message, title) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({ type, title, message });
    });
  }, []);

  const confirmDialog = useCallback((message, title) => openDialog('confirm', message, title), [openDialog]);
  const alertDialog = useCallback((message, title) => openDialog('alert', message, title), [openDialog]);

  const closeDialog = useCallback((result) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setDialog(null);
  }, []);

  const isConfirm = dialog?.type === 'confirm';
  const title = dialog?.title || (isConfirm ? '¿Estás segura?' : 'Atención');

  return (
    <DialogContext.Provider value={{ confirmDialog, alertDialog }}>
      {children}
      <Modal
        open={Boolean(dialog)}
        onClose={() => closeDialog(isConfirm ? false : true)}
        overlayCloses={!isConfirm}
        title={title}
        size="sm"
        zIndex={100}
        footer={
          <div className="flex justify-center gap-3">
            {isConfirm ? (
              <>
                <button type="button" className="btn btn-primary text-sm" onClick={() => closeDialog(true)}>
                  Sí, confirmar
                </button>
                <button type="button" className="btn btn-ghost text-sm" onClick={() => closeDialog(false)}>
                  Cancelar
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-primary text-sm" onClick={() => closeDialog(true)}>
                Entendido
              </button>
            )}
          </div>
        }
      >
        <div className="flex flex-col items-center text-center">
          <img src="/Images/Logo%20sin%20Slogan.png" alt="Grow" className="w-10 h-10 object-contain mb-3" />
          <p className="text-sm text-text-ink whitespace-pre-line">{dialog?.message}</p>
        </div>
      </Modal>
    </DialogContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within a DialogProvider');
  return ctx;
};