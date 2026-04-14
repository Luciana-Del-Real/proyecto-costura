const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function apiFetch(path, options = {}) {
  try {
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    const token = localStorage.getItem('costura_token');

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

    console.log('📤 Request:', { url, method: options.method });
    
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');

    console.log('📥 Response:', { status: response.status, contentType });

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
      const data = await response.json();
      console.log('✅ Response Data:', data);
      return data;
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
