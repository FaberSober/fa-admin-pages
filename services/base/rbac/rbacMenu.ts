import { BaseTreeApi } from '@fa/ui';
import { GATE_APP } from '@/configs';
import type { Fa, Rbac } from '@/types';

/** ------------------------------------------ xx 操作接口 ------------------------------------------ */
class RbacMenuApi extends BaseTreeApi<Rbac.RbacMenu, string> {
  /** 查询流程菜单列表 */
  getFlowMenuList = (): Promise<Fa.Ret<Fa.Option[]>> => this.get('getFlowMenuList');

  /** 导出当前 scope 的菜单 JSON */
  exportJson = (scope: Rbac.RbacMenu['scope']): Promise<undefined> => this.download('exportJson', { scope });

  /** 预览菜单 JSON 导入差异 */
  previewImport = (request: Rbac.RbacMenuImportRequest): Promise<Fa.Ret<Rbac.RbacMenuImportPreview>> => this.post('import/preview', request);

  /** 应用菜单 JSON 导入 */
  commitImport = (request: Rbac.RbacMenuImportRequest): Promise<Fa.Ret<Rbac.RbacMenuImportResult>> => this.post('import/commit', request);
}

export default new RbacMenuApi(GATE_APP.rbac, 'rbacMenu');
