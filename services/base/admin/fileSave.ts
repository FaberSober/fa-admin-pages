import { BaseApi, type Fa } from '@fa/ui';
import type { AxiosRequestConfig } from 'axios';
import { trim } from 'lodash';
import { GATE_APP } from '@/configs';
import type { Admin } from '@/types';

const serviceModule = 'fileSave';

class FileSaveApi extends BaseApi<Admin.FileSave, string> {
  getById = (id: string, config?: AxiosRequestConfig): Promise<Fa.Ret<Admin.FileSave>> => this.get(`getById/${id}`, undefined, config);

  uploadFile = (file: any, callback?: (progressEvent: any) => void): Promise<Fa.Ret<Admin.FileSave>> =>
    this.postFile('upload', file, { onUploadProgress: callback });

  uploadFromUrl = (params: { url: string }): Promise<Fa.Ret<Admin.FileSave>> => this.post('uploadFromUrl', params);

  genLocalGetFile = (fileId: string) => this.getUrl(`getFile/${trim(fileId)}`);

  genLocalGetFilePreview = (fileId: string) => this.getUrl(`getFilePreview/${trim(fileId)}`);

  /** 文件字符获取 */
  getFileStr = (fileId: string, config?: AxiosRequestConfig): Promise<Fa.Ret<string>> => this.get(`getFileStr/${fileId}`, undefined, config);

  openFile = (fileId: string) => window.open(this.genLocalGetFile(fileId), '_blank');
}

export default new FileSaveApi(GATE_APP.admin, serviceModule);
