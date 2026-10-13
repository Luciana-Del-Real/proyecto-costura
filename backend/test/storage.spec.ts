import { ConfigService } from '@nestjs/config';
import { StorageService } from '../src/storage/storage.service';

/**
 * Unit tests for StorageService: it talks to the Supabase Storage REST API with
 * Node's global `fetch`, which is mocked here. No test ever touches the network.
 */
function makeConfig(overrides: Record<string, string | undefined> = {}) {
  const values: Record<string, string | undefined> = {
    SUPABASE_URL: 'https://proj.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    SUPABASE_STORAGE_BUCKET: 'uploads',
    ...overrides,
  };
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

const file = {
  fieldname: 'image',
  originalname: 'foto.png',
  mimetype: 'image/png',
  buffer: Buffer.from('bytes'),
};

describe('StorageService (Supabase Storage REST, fetch mocked)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('sube el buffer y devuelve la URL pública absoluta', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const service = new StorageService(makeConfig());
    const url = await service.upload('courses', file);

    expect(url).toMatch(
      /^https:\/\/proj\.supabase\.co\/storage\/v1\/object\/public\/uploads\/courses\/image-\d+-\d+\.png$/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [endpoint, init] = fetchMock.mock.calls[0];
    expect(endpoint).toMatch(
      /^https:\/\/proj\.supabase\.co\/storage\/v1\/object\/uploads\/courses\/image-\d+-\d+\.png$/,
    );
    expect(init).toMatchObject({
      method: 'POST',
      headers: {
        Authorization: 'Bearer service-role-key',
        apikey: 'service-role-key',
        'Content-Type': 'image/png',
      },
      body: file.buffer,
    });
  });

  it('lanza un error con status y cuerpo cuando la subida no es 2xx', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'bucket not allowed',
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const service = new StorageService(makeConfig());

    await expect(service.upload('courses', file)).rejects.toThrow(
      /403.*bucket not allowed/,
    );
  });

  it('lanza un error claro y no llama a fetch cuando faltan credenciales', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const service = new StorageService(
      makeConfig({ SUPABASE_SERVICE_ROLE_KEY: undefined }),
    );

    expect(service.isConfigured).toBe(false);
    await expect(service.upload('courses', file)).rejects.toThrow(
      /no está configurado/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
