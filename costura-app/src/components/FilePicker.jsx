// Selector de archivos compartido de los formularios admin (portada y PDFs).
// Renderiza el input estilizado y, opcionalmente, un caption debajo del input
// (JSX `children` o un `label` string). Las etiquetas por encima del input y
// el texto de selección siguen viviendo en cada llamador para no mover la UI.
export default function FilePicker({ accept, multiple, onChange, label, children }) {
  return (
    <>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer"
      />
      {children || (label ? <p className="text-xs text-text-ink mt-2">{label}</p> : null)}
    </>
  );
}
