import {GATE_APP} from '@fa-admin-pages/configs';
import {BaseApi, Fa} from '@fa/ui';
import {trim} from 'lodash';
import {Admin} from '@/types';

interface UploadToken {
  token: string;
  host: string;
}

const serviceModule = 'fileSave';

class FileSaveApi extends BaseApi<Admin.FileSave, string> {
  /** 获取七牛云上传token */
  getQiniuUploadToken = (): Promise<Fa.Ret<UploadToken>> => this.get('getQiniuUploadToken');

  uploadFile = (file: any, callback?: (progressEvent: any) => void): Promise<Fa.Ret<Admin.FileSave>> =>
    this.postFile('upload', file, { onUploadProgress: callback });

  uploadFileForm = (formData: any, callback?: (progressEvent: any) => void): Promise<Fa.Ret<Admin.FileSave>> =>
    this.postForm('upload', formData, { onUploadProgress: callback });

  uploadApi = this.getUrl(`upload`);

  genLocalGetFile = (fileId: string) => {
    if (fileId === undefined || fileId == null) return '';
    if (trim(fileId) === '') return '';
    return this.getUrl(`getFile/${fileId}`);
  };

  genLocalGetFilePreview = (fileId: string) => {
    if (fileId === undefined || fileId == null) return '';
    if (trim(fileId) === '') return '';
    return this.getUrl(`getFilePreview/${fileId}`);
  };

}

export default new FileSaveApi(GATE_APP.admin, serviceModule);
