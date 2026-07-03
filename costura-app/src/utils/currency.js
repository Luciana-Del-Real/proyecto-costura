// Devuelve el precio del curso en la moneda que corresponde al usuario
// según el país que eligió al registrarse (ARS = Argentina, AUD = Australia).
// Si no hay usuario logueado (visitante sin cuenta), se usa ARS por defecto.
export function getCoursePrice(course, user) {
  if (!course) return 0;
  return user?.country === 'AUD' ? course.priceAUD : course.priceARS;
}

// Devuelve el código de moneda a mostrar junto al precio (ej. "ARS", "AUD").
export function getCurrencyCode(user) {
  return user?.country === 'AUD' ? 'AUD' : 'ARS';
}

// Dado un array de compras (cada una con .total y .user.country), suma los
// montos separados por moneda. Devuelve { ARS: number, AUD: number }.
export function sumByCurrency(purchases) {
  return (purchases || []).reduce(
    (acc, p) => {
      const currency = p?.user?.country === 'AUD' ? 'AUD' : 'ARS';
      acc[currency] += Number(p?.total || 0);
      return acc;
    },
    { ARS: 0, AUD: 0 },
  );
}

// Formatea un monto junto con su moneda, ej: formatMoney(14000, 'ARS') -> "$14.000 ARS"
export function formatMoney(amount, currency = 'ARS') {
  return `$${Number(amount || 0).toLocaleString()} ${currency}`;
}
