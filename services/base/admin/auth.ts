import { BaseZeroApi, type Fa } from '@fa/ui';
import { GATE_APP } from '@/configs';
import { encryptRequest, type CryptoPreparation, type CryptoPublicKey } from '@fa/core/crypto';

class LoginCryptoApi extends BaseZeroApi {
  publicKey = (): Promise<Fa.Ret<CryptoPublicKey>> => this.get('public-key');
  prepare = (): Promise<Fa.Ret<CryptoPreparation>> => this.post('prepare-login', { purpose: 'ADMIN_LOGIN' });
}

const loginCryptoApi = new LoginCryptoApi(GATE_APP.security, 'crypto');

class Api extends BaseZeroApi {
  /** 登录 */
  login = async (username: string, password: string): Promise<Fa.Ret<Fa.LoginToken>> => {
    const key = await loginCryptoApi.publicKey();
    const ready = await loginCryptoApi.prepare();
    const envelope = await encryptRequest({ username, password }, key.data, ready.data,
      { purpose: 'ADMIN_LOGIN', method: 'POST', path: this.getUrl('loginV2') });
    return this.post('loginV2', envelope);
  };

  /** Token登录 */
  loginByToken = (token: string): Promise<Fa.Ret<Fa.LoginToken>> => this.post('loginByToken', { token });

  /** 登出 */
  logout = (): Promise<Fa.Ret<string>> => this.get('logout');
}

export default new Api(GATE_APP.admin, 'auth');
