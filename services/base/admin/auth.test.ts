import { beforeEach, expect, it, vi } from 'vitest';
const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('@fa/ui', () => ({ BaseZeroApi: class {
  constructor(private prefix: string, private module: string) {}
  post = (action: string, body: object, config?: object) => send(`${this.prefix}/${this.module}/${action}`, body, config);
  get = vi.fn();
} }));
vi.mock('@/configs', () => ({ GATE_APP: { admin: '/api/base/admin' } }));
import auth from './auth';
beforeEach(() => send.mockReset());
it('login only declares the password field and leaves preparation to the common request layer', async () => {
  const result = { data: { tokenValue: 'test' } }; send.mockResolvedValue(result);
  expect(await auth.login('account', ' password ')).toBe(result);
  expect(send).toHaveBeenCalledExactlyOnceWith('/api/base/admin/auth/loginV2',
    { username: 'account', password: ' password ' }, { crypto: { fields: ['password'] } });
});
it('does not retry on failure and keeps token login outside field encryption', async () => {
  send.mockRejectedValueOnce(new Error('failed'));
  await expect(auth.login('a', 'b')).rejects.toThrow('failed'); expect(send).toHaveBeenCalledTimes(1);
  send.mockResolvedValue({}); await auth.loginByToken('test-token');
  expect(send).toHaveBeenLastCalledWith('/api/base/admin/auth/loginByToken', { token: 'test-token' }, undefined);
});
