import { createContext, useCallback, useContext, useRef, useState } from 'react';

const DialogContext = createContext(null);

// Modal de marca Grow que reemplaza los diálogos nativos del navegador
// (window.confirm / alert). Un solo diálogo a la vez:
// - confirmDialog(message, title?) -> Promise<boolean>; resuelve true solo si
//   la usuaria confirma explícitamente, false al cancelar. No se cierra con
//   click en el backdrop (decisión explícita requerida).
// - alertDialog(message, title?) -> Promise<void>; se descarta con click en el
//   backdrop o en "Entendido".
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
      {dialog && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4" role="dialog" aria-modal="true">
          {/* Backdrop: descarta solo el alert; el confirm exige botón explícito */}
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={() => { if (!isConfirm) closeDialog(true); }}
          />
          <div className="relative card-flat rounded-2xl p-6 max-w-sm w-full shadow-card animate-fade-up">
            {/* Barra de acento fucsia, identidad Grow */}
            <div className="h-1 bg-primary rounded-full mb-4" aria-hidden="true" />
            <img src="/Images/Logo%20sin%20Slogan.png" alt="Grow" className="w-10 h-10 object-contain mx-auto mb-3" />
            <h3 className="font-display font-bold text-text-ink text-xl text-center">{title}</h3>
            <p className="text-sm text-text-ink text-center mt-2 mb-6 whitespace-pre-line">{dialog.message}</p>
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
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within a DialogProvider');
  return ctx;
};