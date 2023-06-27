import React, {useState} from 'react';
import {DragModal, DragModalProps, FaUtils, Fa, UploadFileLocal} from '@fa/ui';
import {Col, Form, Row} from "antd";


export interface CommonExcelUploadModalProps extends DragModalProps {
  fetchFinish?: () => void;
  apiDownloadTplExcel: () => any;
  apiImportExcel: (params: {fileId: string}) => Promise<Fa.Ret<boolean>>;
}

/**
 * 通用Excel导入弹框
 * @author xu.pengfei
 * @date 2023/6/27 14:21
 */
export default function CommonExcelUploadModal({ children, title, fetchFinish, apiDownloadTplExcel, apiImportExcel, ...props }: CommonExcelUploadModalProps) {
  const [form] = Form.useForm();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false)

  /** 提交表单 */
  function onFinish(fieldsValue: any) {
    const params = {
      fileId: fieldsValue.fileId,
    };

    setLoading(true)
    apiImportExcel(params).then(res => {
      setLoading(false)
      FaUtils.showResponse(res, '导入文件')
      if (fetchFinish) {
        fetchFinish()
      }
      setOpen(false)
    }).catch(() => setLoading(false))
  }

  function showModal() {
    setOpen(true)
    form.setFieldsValue({ fileId: undefined })
  }

  return (
    <span>
      <span onClick={showModal}>
        {children}
      </span>
      <DragModal
        title="导入文件"
        open={open}
        onOk={() => form.submit()}
        confirmLoading={loading}
        onCancel={() => setOpen(false)}
        width={700}
        {...props}
      >
        <Form form={form} onFinish={onFinish}>
          <Row className="fa-mb12">
            <Col offset={4}>
              <a onClick={apiDownloadTplExcel}>点击下载导入模板Excel文件</a>
            </Col>
          </Row>

          <Form.Item name="fileId" label="导入文件" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <UploadFileLocal accept={FaUtils.FileAccept.EXCEL} />
          </Form.Item>
        </Form>
      </DragModal>
    </span>
  )
}
