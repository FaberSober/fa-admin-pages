import {GATE_APP} from '@/configs';
import {BaseApi, Fa} from '@fa/ui';
import {trim} from 'lodash';
import {Admin} from '@/types';

const serviceModule = 'fileSave';

class FileSaveApi extends BaseApi<Admin.FileSave, string> {

  uploadFile = (file: any, callback?: (progressEvent: any) => void): Promise<Fa.Ret<Admin.FileSave>> =>
    this.postFile('upload', file, { onUploadProgress: callback });

  genLocalGetFile = (fileId: string) => this.getUrl(`getFile/${trim(fileId)}`);

  genLocalGetFilePreview = (fileId: string) => this.getUrl(`getFilePreview/${trim(fileId)}`);

  /** 文件字符获取 */
  getFileStr = (fileId: string): Promise<Fa.Ret<string>> => this.get(`getFileStr/${fileId}`);

}

export default new FileSaveApi(GATE_APP.admin, serviceModule);
