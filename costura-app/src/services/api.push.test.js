// @vitest-environment jsdom
import { expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createPushSubscription, deletePushSubscription, API_BASE_URL } from './api';

/**
 * WU4 — pwa-installability spec. Prueba el wire format de /push-subscriptions
 * contra el controller de Nest (WU1): POST de upsert y DELETE con el endpoint
 * URL-encoded en el path, ambos con Authorization: Bearer heredado del fetch
 * wrapper. PushProvider pasa el endpoint CRUDO; la capa api es la ÚNICA que
 * conoce el encoding, así que acá se prueba que ocurre exactamente una vez
 * (nunca doble-encoded).
 */
const ENDPOINT = 'https://push.example.com/send/abc123';
const KEYS = { p256dh: 'p256dh-key', auth: 'auth-key' };

function jsonResponse(body, { status = 200, contentType = 'application/json' } = {}) {
  return {
    ok: true,
    status,
    headers: { get: (name) => (name === 'content-type' ? contentType : null) },
    json: async () => body,
    text: async () => '',
  };
}

let fetchMock;

beforeEach(() => {
  sessionStorage.setItem('costura_token', 'tok-api');
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

it('POSTs the subscription DTO to /push-subscriptions with the Bearer token', async () => {
  fetchMock.mockResolvedValue(jsonResponse({ id: 's1' }, { status: 201 }));

  const result = await createPushSubscription({ endpoint: ENDPOINT, keys: KEYS });

  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, config] = fetchMock.mock.calls[0];
  expect(url).toBe(`${API_BASE_URL}/push-subscriptions`);
  expect(config.method).toBe('POST');
  expect(JSON.parse(config.body)).toEqual({ endpoint: ENDPOINT, keys: KEYS });
  expect(config.headers.Authorization).toBe('Bearer tok-api');
  expect(config.headers['Content-Type']).toBe('application/json');
  expect(result).toEqual({ id: 's1' });
});

it('DELETEs the endpoint URL-encoded in the path, exactly once', async () => {
  fetchMock.mockResolvedValue(jsonResponse('', { status: 204, contentType: null }));

  await deletePushSubscription(ENDPOINT);

  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, config] = fetchMock.mock.calls[0];
  expect(config.method).toBe('DELETE');
  expect(config.headers.Authorization).toBe('Bearer tok-api');
  const encoded = encodeURIComponent(ENDPOINT);
  expect(url).toBe(`${API_BASE_URL}/push-subscriptions/${encoded}`);
  // El encoding ocurrió una sola vez: si api.js volviera a codificar el path
  // ya encoded, el endpoint llegaría doble-encoded (%253A) y el controller
  // (WU1) no lo matchearía.
  expect(url).toContain('%3A');
  expect(url).not.toContain('%253A');
});

it('rejects when the backend answers 401 (token caducado) para que el caller lo maneje best-effort', async () => {
  fetchMock.mockResolvedValue({
    ok: false,
    status: 401,
    statusText: 'Unauthorized',
    headers: { get: () => 'application/json' },
    json: async () => ({ message: 'No autorizado' }),
    text: async () => '',
  });

  await expect(createPushSubscription({ endpoint: ENDPOINT, keys: KEYS })).rejects.toThrow('No autorizado');
});
