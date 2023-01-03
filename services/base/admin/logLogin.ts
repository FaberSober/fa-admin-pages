import {GATE_APP} from '@fa-admin-pages/configs';
import {BaseApi} from '@fa/ui';
import {Admin} from '@/types';

/** ------------------------------------------ xx 操作接口 ------------------------------------------ */
class LogLoginApi extends BaseApi<Admin.LogLogin, number> {}

export default new LogLoginApi(GATE_APP.admin, 'logLogin');
