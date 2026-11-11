import { GATE_APP } from '@/configs';
import { BaseApi, type Fa } from '@fa/ui';
import type { Admin } from '@/types';

/** ------------------------------------------ xx 操作接口 ------------------------------------------ */
const serviceModule = 'job';

class Job extends BaseApi<Admin.Job, number> {
  visualTimeline = (date: string, filter: import('@features/fa-admin-pages/pages/admin/system/base/job/visual/timeline').TimelineFilter, signal?: AbortSignal): Promise<Fa.Ret<import('@features/fa-admin-pages/pages/admin/system/base/job/visual/timeline').TimelineResult>> =>
    this.get('visual/timeline', { date, ...filter }, { signal });
  visualCalendar = (month: string, signal?: AbortSignal): Promise<Fa.Ret<{ date: string; total: number; success: number; failed: number }[]>> =>
    this.get('visual/calendar', { month }, { signal });
  reconcileFlow = (id: number, jobId: number): Promise<Fa.Ret<Admin.JobFlowRun>> => this.post(`reconcileFlow/${id}`, {}, { params: { jobId } });
  stopFlow = (id: number, jobId: number): Promise<Fa.Ret<Admin.JobFlowRun>> => this.post(`stopFlow/${id}`, {}, { params: { jobId } });
  runFlow = (id: number): Promise<Fa.Ret<Admin.JobFlowRun>> => this.post(`runFlow/${id}`);
  flowRun = (id: number, signal?: AbortSignal, jobId?: number): Promise<Fa.Ret<Admin.JobFlowRun>> => this.get(`flowRun/${id}`, { jobId }, { signal });
  flowRunsPage = (jobId: number, params: any, signal?: AbortSignal): Promise<Fa.Ret<Fa.Page<Admin.JobLog>>> => this.post(`flowRunsPage/${jobId}`, params, { signal });
  flowRunsStats = (jobId: number, params: any, signal?: AbortSignal): Promise<Fa.Ret<Admin.JobFlowHistoryStats>> => this.post(`flowRunsStats/${jobId}`, params, { signal });
  flowRuns = (id: number): Promise<Fa.Ret<Admin.JobLog[]>> => this.get(`flowRuns/${id}`);
  /** 只读检查已保存的流程定义，不执行任务。 */
  preflightFlow = (id: number): Promise<Fa.Ret<Admin.JobFlowPreflight>> => this.get(`preflightFlow/${id}`);
  /** 获取唯一实体 */
  runOneTime = (id: number): Promise<Fa.Ret> => this.get(`runOneTime/${id}`);

  /** 获取唯一实体 */
  startJob = (id: number): Promise<Fa.Ret> => this.get(`startJob/${id}`);

  /** 获取唯一实体 */
  endJob = (id: number): Promise<Fa.Ret> => this.get(`endJob/${id}`);

  /** 获取cron最近5次运行时间 */
  quartzLatest = (cron: string, times: number): Promise<Fa.Ret<string[]>> =>
    this.post(
      `quartz/latest`,
      { cron, times },
      {
        headers: { hideErrorMsg: '1' },
      },
    );

  getRegisteredJobs = (): Promise<Fa.Ret<Admin.RegisteredJob[]>> => this.get('getRegisteredJobs');

  /** Get All Quartz Job Class List. */
  getAllJobs = (): Promise<Fa.Ret<Fa.Option[]>> => this.get('getAllJobs');

  /** Get Idle Quartz Job Class List. */
  getIdleJobs = (): Promise<Fa.Ret<Fa.Option[]>> => this.get('getIdleJobs');
}

export default new Job(GATE_APP.admin, serviceModule);
