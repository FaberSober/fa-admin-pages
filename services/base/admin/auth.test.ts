import { beforeEach, expect, it, vi } from 'vitest';

const { send, encrypt } = vi.hoisted(() => ({ send: vi.fn(), encrypt: vi.fn() }));
vi.mock('@fa/ui', () => ({
  BaseZeroApi: class {
    constructor(private prefix: string, private module: string) {}
    getUrl = (action: string) => `${this.prefix}/${this.module}/${action}`;
    get = (action: string) => send(this.getUrl(action));
    post = (action: string, body: object) => send(this.getUrl(action), body);
  },
}));
vi.mock('@/configs', () => ({ GATE_APP: { admin: '/api/base/admin', security: '/api/base/security' } }));
vi.mock('@fa/core/crypto', () => ({ encryptRequest: encrypt }));
import auth from './auth';

const key = { v: 1, kid: 'test', publicKey: 'test-public-key' };
const envelope = { v: 1, kid: 'test', challengeId: null, purpose: 'ADMIN_LOGIN', encryptedKey: 'test-key', iv: 'test-iv', ciphertext: 'test-cipher' };

beforeEach(() => { send.mockReset(); encrypt.mockReset(); });

it.each([false, true])('encrypts credentials and sends only the envelope with replay=%s', async (replayEnabled) => {
  const ready = { v: 1, kid: 'test', replayEnabled, challengeId: replayEnabled ? 'test-challenge' : null, expiresAt: null };
  const session = { data: { tokenValue: 'test-token' } };
  send.mockResolvedValueOnce({ data: key }).mockResolvedValueOnce({ data: ready }).mockResolvedValueOnce(session);
  encrypt.mockResolvedValue(envelope);
  expect(await auth.login('account', ' password ')).toBe(session);
  expect(send.mock.calls).toEqual([
    ['/api/base/security/crypto/public-key'],
    ['/api/base/security/crypto/prepare-login', { purpose: 'ADMIN_LOGIN' }],
    ['/api/base/admin/auth/loginV2', envelope],
  ]);
  expect(encrypt).toHaveBeenCalledWith({ username: 'account', password: ' password ' }, key, ready,
    { purpose: 'ADMIN_LOGIN', method: 'POST', path: '/api/base/admin/auth/loginV2' });
});

it('does not retry or fall back to plaintext when preparation, encryption or login fails', async () => {
  for (const failure of ['prepare', 'encrypt', 'login']) {
    send.mockReset(); encrypt.mockReset();
    send.mockResolvedValueOnce({ data: key });
    if (failure === 'prepare') send.mockRejectedValueOnce(new Error('failed'));
    else send.mockResolvedValueOnce({ data: {} }).mockRejectedValueOnce(new Error('failed'));
    if (failure === 'encrypt') encrypt.mockRejectedValue(new Error('failed'));
    else encrypt.mockResolvedValue(envelope);
    await expect(auth.login('account', 'password')).rejects.toThrow('failed');
    expect(send).toHaveBeenCalledTimes(failure === 'login' ? 3 : 2);
    expect(send.mock.calls.some(([url]) => url.endsWith('/login'))).toBe(false);
  }
});
