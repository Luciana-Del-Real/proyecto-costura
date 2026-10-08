// Base de la API: VITE_API_URL incluye el prefijo por convención (ver
// .env.local). Los helpers reciben paths SIN prefijo (ej. /auth/login) y se
// concatenan acá. Es la ÚNICA definición del origen de la API: media.js la
// importa para derivar el origen de estáticos. El fallback de abajo es SOLO
// para desarrollo local y se compone en partes para no hardcodear un origen
// fijo en el bundle.
const DEV_API_ORIGIN = `http://localhost:${3000}`;
export const API_BASE_URL = (import.meta.env.VITE_API_URL || `${DEV_API_ORIGIN}/api`);

async function apiFetch(path, options = {}) {
  try {
    const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
    const token = sessionStorage.getItem('costura_token');

    const defaultHeaders = {
      'Accept': 'application/json',
    };

    // Check if it's FormData. Using constructor.name helps avoid cross-frame/polyfill instanceof issues
    const isFormData = options.body && (
      options.body instanceof FormData || 
      options.body.constructor.name === 'FormData'
    );

    if (!isFormData) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      credentials: 'include',
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    };

    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');

    if (!response.ok) {
      let errorMessage = `${response.status} ${response.statusText}`;
      if (contentType?.includes('application/json')) {
        const errorBody = await response.json();
        if (errorBody?.message) errorMessage = errorBody.message;
      }
      console.error('❌ API Error:', errorMessage);
      throw new Error(errorMessage);
    }

    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return response.text();
  } catch (error) {
    console.error('🔴 Fetch Error:', error);
    throw error;
  }
}

export async function get(path) {
  return apiFetch(path, { method: 'GET' });
}

export async function post(path, body) {
  return apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
}

export async function postForm(path, formData) {
  return apiFetch(path, { method: 'POST', body: formData });
}

export async function put(path, body) {
  return apiFetch(path, { method: 'PUT', body: JSON.stringify(body) });
}

export async function putForm(path, formData) {
  return apiFetch(path, { method: 'PUT', body: formData });
}

export async function patch(path, body) {
  return apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function del(path) {
  return apiFetch(path, { method: 'DELETE' });
}

// Web Push (WU4 — pwa-installability spec). El backend identifica la
// suscripción por su endpoint: POST hace upsert (reconcilia logouts corridos)
// y DELETE recibe el endpoint URL-encoded en el path, como exige el
// controller de Nest. Ambos heredan la inyección de Authorization: Bearer.
export async function createPushSubscription(subscription) {
  return post('/push-subscriptions', subscription);
}

export async function deletePushSubscription(endpoint) {
  return del(`/push-subscriptions/${encodeURIComponent(endpoint)}`);
}

// Certificados: el certificado NO se genera en la app. La alumna lo solicita
// (cuando completó el curso), la profesora lo arma y lo envía por mail fuera
// del sistema. Acá solo se registra la solicitud y su estado (PENDING -> SENT).
export async function requestCertificate(courseId) {
  return post(`/courses/${courseId}/certificate/request`);
}

export async function getMyCertificateRequest(courseId) {
  return get(`/courses/${courseId}/certificate/request`);
}

// Bandeja del admin: todas las solicitudes con alumna y curso.
export async function listCertificateRequests() {
  return get('/admin/certificate-requests');
}

export async function markCertificateRequestSent(id) {
  return patch(`/admin/certificate-requests/${id}`, { status: 'SENT' });
}

// Eventos: la grilla pública (solo visibles) y el CRUD del admin. Los
// folletos se arman con texto (título, descripción, detalle), así que el
// admin manda JSON.
export async function listPublicEvents() {
  return get('/events');
}

export async function listAdminEvents() {
  return get('/admin/events');
}

export async function getEvent(id) {
  return get(`/admin/events/${id}`);
}

export async function createEvent(data) {
  return post('/admin/events', data);
}

export async function updateEvent(id, data) {
  return put(`/admin/events/${id}`, data);
}

export async function deleteEvent(id) {
  return del(`/admin/events/${id}`);
}

// Solicitudes de compra de patrones de pago (mismo flujo que los cursos).
export async function requestPatternPurchase(patternId) {
  return post(`/patterns/${patternId}/purchase`);
}

export async function listPatternPurchasesPending() {
  return get('/admin/pattern-purchases/pending');
}

export async function approvePatternPurchase(id) {
  return patch(`/admin/pattern-purchases/${id}/approve`);
}

export async function rejectPatternPurchase(id) {
  return patch(`/admin/pattern-purchases/${id}/reject`);
}
