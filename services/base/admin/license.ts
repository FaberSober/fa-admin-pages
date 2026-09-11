import { BaseZeroApi, type Fa } from '@fa/ui';
import { GATE_APP } from '@/configs';
import type { Admin } from '@/types';

class LicenseApi extends BaseZeroApi {
  info = (): Promise<Fa.Ret<Admin.LicenseStatus>> => this.get('info');

  refresh = (): Promise<Fa.Ret<Admin.LicenseStatus>> => this.post('refresh', {});

  importLicense = (file: File): Promise<Fa.Ret<Admin.LicenseStatus>> => this.postFile('import', file);
}

export default new LicenseApi(GATE_APP.admin, 'license');
