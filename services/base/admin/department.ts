import { BaseTreeApi, type Fa } from '@fa/ui';
import { GATE_APP } from '@/configs';
import type { Admin } from '@/types';

/** ------------------------------------------ xx 操作接口 ------------------------------------------ */
const serviceModule = 'department';

export interface DepartmentImportReq {
  fileId: string;
}

export interface DepartmentImportError {
  rowNumber: number;
  departmentName?: string;
  message: string;
}

export interface DepartmentImportPreview {
  totalCount: number;
  validCount: number;
  errorCount: number;
  createCount: number;
  updateCount: number;
  errors: DepartmentImportError[];
}

export interface DepartmentImportResult {
  totalCount: number;
  createCount: number;
  updateCount: number;
}

class Department extends BaseTreeApi<Admin.Department, string, Admin.DepartmentVo> {}

class DepartmentApi extends Department {
  /** 部门导入模板 */
  downloadImportTemplate = (): Promise<undefined> => this.download('exportTplExcel', {});

  /** 部门导入预览 */
  previewImport = (params: DepartmentImportReq): Promise<Fa.Ret<DepartmentImportPreview>> => this.post('import/preview', params);

  /** 部门导入提交 */
  commitImport = (params: DepartmentImportReq): Promise<Fa.Ret<DepartmentImportResult>> => this.post('import/commit', params);
}

export default new DepartmentApi(GATE_APP.admin, serviceModule);
