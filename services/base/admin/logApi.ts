import {GATE_APP} from '@fa-admin-pages/configs';
import {BaseApi} from '@fa/ui';
import {Admin} from '@/types';

/** ------------------------------------------ xx 操作接口 ------------------------------------------ */
class LogApiApi extends BaseApi<Admin.LogApi, string> {}

export default new LogApiApi(GATE_APP.admin, 'logApi');
