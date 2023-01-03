import { GATE_APP } from '@/configs/server.config';
import { BaseTreeApi } from '@fa/ui';
import { Demo } from '@/types';

/** ------------------------------------------ xx 操作接口 ------------------------------------------ */
const serviceModule = 'tree';

class Api extends BaseTreeApi<Demo.Tree, number> {}

export default new Api(GATE_APP.demo, serviceModule);
