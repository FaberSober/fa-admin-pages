import { BaseZeroApi, type Fa } from '@fa/ui';
import { GATE_APP } from '@/configs';
import type { Admin } from '@/types';

class LicenseApi extends BaseZeroApi {
  info = (): Promise<Fa.Ret<Admin.LicenseStatus>> => this.get('info');

  recoveryInfo = (machineId: string): Promise<Fa.Ret<Admin.LicenseRecoveryStatus>> => this.get('recovery-info', { machineId });

  refresh = (): Promise<Fa.Ret<Admin.LicenseStatus>> => this.post('refresh', {});

  importLicense = (file: File): Promise<Fa.Ret<Admin.LicenseStatus>> => this.postFile('import', file);

  recoveryImport = (file: File, machineId: string): Promise<Fa.Ret<Admin.LicenseRecoveryStatus>> =>
    this.postFile('recovery-import', file, { params: { machineId } });
}

export default new LicenseApi(GATE_APP.admin, 'license');
