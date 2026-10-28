import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { act, createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CommonExcelUploadModal from './CommonExcelUploadModal';

const ui = vi.hoisted(() => ({
  modal: {} as any, formProps: {} as any, progress: {} as any, alert: {} as any,
  open: undefined as undefined | (() => void), id: 0,
  form: { setFieldsValue: vi.fn(), submit: vi.fn() },
  listeners: new Set<(event: { payload: any }) => void>(),
}));

vi.mock('@fa/ui', () => ({
  DragModal: (props: any) => { ui.modal = props; return props.open ? props.children : null; },
  UploadFileLocal: () => null,
  BaseDrawer: () => null,
  FaUtils: { uuid: () => `import-${++ui.id}`, showResponse: vi.fn(), formItemFullLayout: {}, FileAccept: { EXCEL: '.xlsx' } },
}));
vi.mock('antd', () => ({
  Form: Object.assign((props: any) => { ui.formProps = props; return props.children; }, {
    useForm: () => [ui.form], Item: ({ children }: any) => children,
  }),
  Col: ({ children }: any) => children,
  Row: ({ children }: any) => children,
  Alert: (props: any) => { ui.alert = props; return null; },
  Progress: (props: any) => { ui.progress = props; return null; },
}));
vi.mock('@features/fa-admin-pages/components', () => ({ FileBizList: () => null }));
vi.mock('../socket/WebSocketPlainTextCube', () => ({ default: () => null }));
vi.mock('@features/fa-admin-pages/layout/websocket', () => ({ sendMessage: vi.fn() }));
vi.mock('use-bus', async () => {
  const { useEffect } = await import('react');
  return {
    default: (_types: string[], callback: (event: { payload: any }) => void, dependencies: any[]) => {
      useEffect(() => {
        ui.listeners.add(callback);
        return () => { ui.listeners.delete(callback); };
      }, dependencies);
    },
  };
});

const require = createRequire(import.meta.url);
const reconcilerPath = require.resolve('react-reconciler', { paths: [dirname(require.resolve('@react-three/fiber/package.json'))] });
const renderer = require(reconcilerPath)({
  supportsMutation: true, isPrimaryRenderer: true,
  getRootHostContext: () => null, getChildHostContext: () => null, prepareForCommit: () => null,
  resetAfterCommit: () => {}, clearContainer: () => {}, getCurrentEventPriority: () => 16,
  scheduleTimeout: setTimeout, cancelTimeout: clearTimeout, noTimeout: -1,
  createInstance: (_type: string, props: any) => { if (props.onClick) ui.open = props.onClick; return {}; },
  createTextInstance: () => ({}), shouldSetTextContent: () => false, finalizeInitialChildren: () => false,
  appendInitialChild: () => {}, appendChild: () => {}, appendChildToContainer: () => {},
  removeChild: () => {}, removeChildFromContainer: () => {},
  prepareUpdate: () => true, commitUpdate: () => {}, commitTextUpdate: () => {}, detachDeletedInstance: () => {},
});

let root: any;
const api = vi.fn();
const refresh = vi.fn();

function deferred() {
  let resolve!: (value: any) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise((resolvePromise, rejectPromise) => { resolve = resolvePromise; reject = rejectPromise; });
  return { promise, resolve, reject };
}

function mount(showProgress = true) {
  act(() => renderer.updateContainer(createElement(CommonExcelUploadModal, {
    apiImportExcel: api, fetchFinish: refresh, showProgress, children: createElement('button', { type: 'button' }, '导入'),
  }), root, null, () => {}));
  act(() => ui.open?.());
}

function progress(payload: Record<string, any>) {
  act(() => {
    const data = { taskId: 'import-1', name: '导入', total: 10, cur: 0, error: 0, ...payload };
    for (const listener of [...ui.listeners]) listener({ payload: data });
  });
}

beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  ui.id = 0;
  ui.listeners.clear();
  ui.alert = {};
  ui.progress = {};
  vi.clearAllMocks();
  api.mockReset();
  ui.form.submit.mockImplementation(() => ui.formProps.onFinish({ fileId: 'excel-file' }));
  root = renderer.createContainer({}, 0, null, false, null, '', () => {}, null);
});
afterEach(() => act(() => renderer.updateContainer(null, root, null, () => {})));

describe('Excel 导入完成及重复提交', () => {
  it('locks rapid clicks and waits for committed completion before enabling the finish button', async () => {
    const request = deferred();
    api.mockReturnValue(request.promise);
    mount();
    act(() => { ui.modal.onOk(); ui.modal.onOk(); });
    expect(api).toHaveBeenCalledTimes(1);
    await act(async () => request.resolve({ status: 200, data: true }));
    expect(ui.modal.confirmLoading).toBe(true);
    expect(ui.modal.cancelButtonProps.disabled).toBe(true);
    expect(ui.formProps.disabled).toBe(true);
    act(() => ui.modal.onCancel());
    expect(ui.modal.open).toBe(true);
    progress({ status: 'RUNNING', cur: 10 });
    expect(ui.progress.percent).toBe(99);
    expect(refresh).not.toHaveBeenCalled();
    progress({ status: 'COMPLETED', cur: 10, message: '共处理10条数据' });
    expect(ui.progress).toMatchObject({ percent: 100, status: 'success' });
    expect(ui.alert).toMatchObject({ type: 'success', message: '导入完成' });
    expect(ui.modal).toMatchObject({ confirmLoading: false, okText: '完成' });
    progress({ status: 'COMPLETED', cur: 10 });
    expect(refresh).toHaveBeenCalledTimes(1);
    act(() => { ui.formProps.onFinish({ fileId: 'excel-file' }); ui.modal.onOk(); });
    expect(api).toHaveBeenCalledTimes(1);
    expect(ui.modal.open).toBe(false);
  });

  it('reports a failure, allows retry, and ignores callbacks from the previous attempt', async () => {
    const first = deferred();
    const second = deferred();
    api.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    mount();
    act(() => ui.modal.onOk());
    progress({ status: 'FAILED', error: 1, message: '表头不正确' });
    expect(ui.alert).toMatchObject({ type: 'error', description: '表头不正确' });
    expect(ui.modal).toMatchObject({ confirmLoading: false, okText: '重新导入' });
    expect(ui.formProps.disabled).toBe(false);
    act(() => ui.modal.onOk());
    expect(api).toHaveBeenCalledTimes(2);
    await act(async () => first.reject(new Error('迟到的旧请求错误')));
    progress({ taskId: 'import-1', status: 'COMPLETED', cur: 10 });
    expect(ui.modal.confirmLoading).toBe(true);
    expect(refresh).not.toHaveBeenCalled();
    progress({ taskId: 'import-2', status: 'COMPLETED', cur: 10 });
    expect(ui.modal.okText).toBe('完成');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('finishes an empty workbook and keeps completion if the HTTP response arrives late', async () => {
    const request = deferred();
    api.mockReturnValue(request.promise);
    mount();
    act(() => ui.modal.onOk());
    progress({ status: 'COMPLETED', total: 0, cur: 0 });
    expect(ui.progress.percent).toBe(100);
    expect(ui.modal.okText).toBe('完成');
    await act(async () => request.reject(new Error('迟到的请求错误')));
    expect(ui.modal.okText).toBe('完成');
    act(() => ui.modal.onOk());
    expect(api).toHaveBeenCalledTimes(1);
  });

  it('unlocks a rejected request for retry', async () => {
    const request = deferred();
    api.mockReturnValue(request.promise);
    mount();
    act(() => ui.modal.onOk());
    await act(async () => request.reject(new Error('请求失败')));
    expect(ui.modal.confirmLoading).toBe(false);
    expect(ui.formProps.disabled).toBe(false);
    expect(ui.modal.open).toBe(true);
  });

  it('accepts the previous progress protocol', async () => {
    api.mockResolvedValue({ status: 200, data: true });
    mount();
    await act(async () => ui.modal.onOk());
    progress({ cur: 10 });
    expect(ui.modal.okText).toBe('完成');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('keeps synchronous imports closing when the request succeeds', async () => {
    api.mockResolvedValue({ status: 200, data: true });
    mount(false);
    await act(async () => ui.modal.onOk());
    expect(ui.modal.open).toBe(false);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(api).toHaveBeenCalledTimes(1);
  });
});
