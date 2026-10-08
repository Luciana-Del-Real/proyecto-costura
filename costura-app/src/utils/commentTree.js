// Construye un árbol de comentarios a partir de la lista plana que devuelve
// el backend: cada respuesta (parentId) queda agrupada bajo su padre, y el
// hilo se arma recursivamente. La lista ya viene ordenada por createdAt asc,
// así que el orden de inserción es estable.
export function groupCommentsByParent(items) {
  const childrenOf = new Map();
  const topLevel = [];

  for (const item of items || []) {
    const pid = item.parentId || null;
    if (!pid) {
      topLevel.push(item);
    } else {
      if (!childrenOf.has(pid)) childrenOf.set(pid, []);
      childrenOf.get(pid).push(item);
    }
  }

  return { childrenOf, topLevel };
}
