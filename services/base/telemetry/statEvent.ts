import { GATE_APP } from '@/configs';
import { BaseApi } from '@fa/ui';
import type { Admin } from '@/types';

export default new BaseApi<Admin.StatEvent, number>(GATE_APP.telemetry, 'statEvent');
