import { type ReactNode, useRef, useState } from 'react';
import { DragModal, type DragModalProps, FaUtils, type Fa, UploadFileLocal, BaseDrawer } from '@fa/ui';
import { Alert, Button, Col, Form, Row } from 'antd';
import { FileBizList } from "@features/fa-admin-pages/components";
import WebSocketPlainTextCube from "../socket/WebSocketPlainTextCube";
import WebSocketTaskProgress from "../socket/WebSocketTaskProgress";
import { sendMessage } from '@features/fa-admin-pages/layout/websocket';

export interface CommonExcelUploadModalProps extends DragModalProps {
  fetchFinish?: () => void;
  apiDownloadTplExcel?: () => any;
  apiImportExcel: (params: { fileId: string } & any) => Promise<Fa.Ret<boolean>>;
  templates?: string | ReactNode; // 下载模板
  formItems?: ReactNode;
  extraParams?: Record<any, any>;
  tips?: string | ReactNode;
  showTemplateDownload?: boolean;
  /** 展示websocket导入过程文本信息 */
  showMsg?: boolean;
  showMsgChannel?: string;
  /** 展示WebSocket任务进度 */
  showProgress?: boolean;
  /** 导入批次大小 */
  importBatchSize?: number;
  accept?: string;
  /** 导入业务类型，有值的话展示导入关联的导入历史记录 */
  type?: string;
  /** 表格初始化数值 */
  formInitValues?: any;
}

/**
 * 通用Excel导入弹框
 * @author xu.pengfei
 * @date 2023/6/27 14:21
 */
export default function CommonExcelUploadModal({
  children,
  title,
  fetchFinish,
  apiDownloadTplExcel,
  apiImportExcel,
  templates,
  formItems,
  extraParams,
  tips,
  showTemplateDownload = true,
  showMsg = true,
  showMsgChannel,
  showProgress = false,
  importBatchSize = 1000,
  accept,
  type,
  formInitValues,
  ...props
}: CommonExcelUploadModalProps) {
  const [form] = Form.useForm();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState<Fa.SocketTaskVo>();
  const submittedRef = useRef(false);
  const taskRef = useRef<Fa.SocketTaskVo>();
  const completed = task?.status === 'COMPLETED';
  const failed = task?.status === 'FAILED';

  /** 提交表单 */
  function onFinish(fieldsValue: any) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const taskId = showProgress ? FaUtils.uuid() : undefined;
    if (taskId) {
      const nextTask: Fa.SocketTaskVo = {
        taskId,
        name: '导入文件',
        total: 0,
        cur: 0,
        error: 0,
        startTime: new Date().toISOString(),
        status: 'RUNNING',
      };
      taskRef.current = nextTask;
      setTask(nextTask);
      sendMessage({ type: 'WebSocketTaskDemo', data: { taskId } });
    }

    const params = {
      ...fieldsValue,
      ...extraParams,
      buzzType: type,
      taskId,
      importBatchSize: showProgress ? importBatchSize : undefined,
    };

    setLoading(true);
    apiImportExcel(params)
      .then((res) => {
        if (showProgress && (taskRef.current?.taskId !== taskId || taskRef.current?.status !== 'RUNNING')) return;
        FaUtils.showResponse(res, showProgress ? '提交导入任务' : '导入文件');
        if (!showProgress) {
          submittedRef.current = false;
          setLoading(false);
          fetchFinish?.();
          setOpen(false);
        }
      })
      .catch(() => {
        if (showProgress && (taskRef.current?.taskId !== taskId || taskRef.current?.status === 'COMPLETED')) return;
        submittedRef.current = false;
        taskRef.current = undefined;
        setTask(undefined);
        setLoading(false);
      });
  }

  function showModal() {
    if (submittedRef.current && taskRef.current?.status !== 'COMPLETED') return;
    submittedRef.current = false;
    taskRef.current = undefined;
    setOpen(true);
    setTask(undefined);
    form.setFieldsValue({ fileId: undefined, ...formInitValues });
  }

  function onTaskChange(nextTask: Fa.SocketTaskVo) {
    const current = taskRef.current;
    if (!current || current.taskId !== nextTask.taskId || current.status === 'COMPLETED' || current.status === 'FAILED') return;
    const status = nextTask.status ?? (nextTask.total > 0 && nextTask.cur >= nextTask.total ? (nextTask.error > 0 ? 'FAILED' : 'COMPLETED') : 'RUNNING');
    const next = { ...nextTask, status };
    taskRef.current = next;
    setTask(next);
    if (status === 'FAILED') {
      submittedRef.current = false;
      setLoading(false);
    } else if (status === 'COMPLETED') {
      setLoading(false);
      fetchFinish?.();
    }
  }

  function closeModal() {
    if (!submittedRef.current || taskRef.current?.status === 'COMPLETED') setOpen(false);
  }

  return (
    <span>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: the supplied child is the modal trigger. */}
      <span onClick={showModal}>{children}</span>
      <DragModal
        width={700}
        {...props}
        title={title || '导入文件'}
        open={open}
        onOk={() => completed ? closeModal() : form.submit()}
        okText={completed ? '完成' : loading ? '导入中' : failed ? '重新导入' : '导入'}
        confirmLoading={loading}
        onCancel={closeModal}
        cancelButtonProps={{ disabled: loading, style: completed ? { display: 'none' } : undefined }}
        {...(loading ? { closable: false, keyboard: false, mask: { closable: false } } : {})}
      >
        <Form form={form} onFinish={onFinish} disabled={loading || completed} {...FaUtils.formItemFullLayout}>
          {showProgress && task && (
            <Alert
              className="fa-mb12"
              type={completed ? 'success' : failed ? 'error' : 'info'}
              showIcon
              message={completed ? '导入完成' : failed ? '导入失败' : '正在导入，请稍候'}
              description={task.message}
            />
          )}
          {showTemplateDownload && (
            <Row className="fa-mb12">
              <Col offset={4} className="fa-flex-column">
                {apiDownloadTplExcel && <Button type="link" size="small" style={{ padding: 0 }} onClick={apiDownloadTplExcel}>点击下载导入模板Excel文件</Button>}
                {templates}
              </Col>
            </Row>
          )}

          {formItems}

          <Form.Item name="fileId" label="导入文件" rules={[{ required: true }]}>
            <UploadFileLocal accept={accept ? accept : FaUtils.FileAccept.EXCEL} disabled={loading || completed} />
          </Form.Item>

          {tips && (
            <Row className="fa-mb12">
              <Col offset={4} md={20}>
                {tips}
              </Col>
            </Row>
          )}

          {type && (
            <Row className="fa-mb12">
              <Col offset={4} md={20}>
                <BaseDrawer triggerDom={<a>导入历史记录</a>} title="导入历史记录">
                  <FileBizList mainBizId="" bizId="" type={type} />
                </BaseDrawer>
              </Col>
            </Row>
          )}

          {showMsg && (
            <div className="fa-mb12">
              <WebSocketPlainTextCube channel={showMsgChannel} />
            </div>
          )}

          {showProgress && task && (
            <Row className="fa-mb12">
              <Col offset={4} md={20}>
                <WebSocketTaskProgress task={task} onTaskChange={onTaskChange} status={loading ? 'active' : undefined} />
              </Col>
            </Row>
          )}
        </Form>
      </DragModal>
    </span>
  );
}
