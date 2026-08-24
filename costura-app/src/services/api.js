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

// Para descargar archivos binarios (ej. el PDF del certificado), que no
// son JSON y necesitan el token de sesión igual que cualquier otro pedido.
export async function downloadFile(path, filename) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const token = sessionStorage.getItem('costura_token');
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch { /* la respuesta no era JSON */ }
    throw new Error(message);
  }
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
