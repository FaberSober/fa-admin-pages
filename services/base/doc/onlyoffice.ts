import { BaseZeroApi, type Fa } from '@fa/ui';
import type { AxiosRequestConfig } from 'axios';
import { GATE_APP } from '@/configs';

class Api extends BaseZeroApi {
  /** 打开文件Token */
  openFile = (fileId: string, mode: string, config?: AxiosRequestConfig): Promise<Fa.Ret<{ documentApi: string; fileModel: any }>> =>
    this.get(`openFile/${fileId}`, { mode }, config);
}

export default new Api(GATE_APP.doc, 'onlyoffice');
