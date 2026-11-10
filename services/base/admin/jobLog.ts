import { GATE_APP } from '@/configs';
import { BaseApi } from '@fa/ui';
import type { Admin } from '@/types';

/** ------------------------------------------ xx 操作接口 ------------------------------------------ */
class JobLogApi extends BaseApi<Admin.JobLog, number> {
  flowOrigin = (id: number, signal?: AbortSignal) => this.get<Admin.JobFlowLogOrigin | null>(`flowOrigin/${id}`, {}, { signal, headers: { hideErrorMsg: '1' } });

  readLog = (id: number, offset: string, signal: AbortSignal) =>
    this.get<Admin.JobLogRead>(`read/${id}`, { offset, maxBytes: 32768 }, { signal, headers: { hideErrorMsg: '1' } });

  downloadLog = (id: number) => this.download(`download/${id}`, {});
}

export default new JobLogApi(GATE_APP.admin, 'jobLog');
