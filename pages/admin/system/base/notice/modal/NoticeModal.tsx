import React, { useContext, useState } from 'react';
import { get } from 'lodash';
import { Form, Input } from 'antd';
import { Admin, BaseBoolRadio, DragModal, DragModalProps, FaUtils, UploadImgLocal } from '@fa/ui';
import { noticeApi } from '@/services';
import { ApiEffectLayoutContext } from '@fa/ui';

const serviceName = '通知与公告';

interface IProps extends DragModalProps {
  title?: string;
  record?: Admin.Notice;
  fetchFinish?: () => void;
}

/**
 * BASE-通知与公告实体新增、编辑弹框
 */
export default function NoticeModal({ children, title, record, fetchFinish, ...props }: IProps) {
  const { loadingEffect } = useContext(ApiEffectLayoutContext);
  const [form] = Form.useForm();

  const [open, setOpen] = useState(false);

  /** 新增Item */
  function invokeInsertTask(params: any) {
    noticeApi.save(params).then((res) => {
      FaUtils.showResponse(res, `新增${serviceName}`);
      setOpen(false);
      if (fetchFinish) fetchFinish();
    });
  }

  /** 更新Item */
  function invokeUpdateTask(params: any) {
    noticeApi.update(params.id, params).then((res) => {
      FaUtils.showResponse(res, `更新${serviceName}`);
      setOpen(false);
      if (fetchFinish) fetchFinish();
    });
  }

  /** 提交表单 */
  function onFinish(fieldsValue: any) {
    const values = {
      ...fieldsValue,
      // birthday: getDateStr000(fieldsValue.birthday),
    };
    if (record) {
      invokeUpdateTask({ ...record, ...values });
    } else {
      invokeInsertTask({ ...values });
    }
  }

  const loading = loadingEffect[noticeApi.getUrl('save')] || loadingEffect[noticeApi.getUrl('update')];
  return (
    <span>
      <span onClick={() => setOpen(true)}>{children}</span>
      <DragModal
        title={title}
        open={open}
        onOk={() => form.submit()}
        confirmLoading={loading}
        onCancel={() => setOpen(false)}
        width={700}
        {...props}
      >
        <Form
          form={form}
          onFinish={onFinish}
          initialValues={{
            title: get(record, 'title'),
            content: get(record, 'content'),
            url: get(record, 'url'),
            status: get(record, 'status'),
            forApp: get(record, 'forApp'),
            strongNotice: get(record, 'strongNotice'),
          }}
        >
          <Form.Item name="title" label="标题" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input.TextArea maxLength={255} />
          </Form.Item>
          <Form.Item name="url" label="图片" {...FaUtils.formItemFullLayout}>
            <UploadImgLocal />
          </Form.Item>
          <Form.Item name="status" label="是否有效" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <BaseBoolRadio />
          </Form.Item>
          <Form.Item name="strongNotice" label="是否强提醒" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <BaseBoolRadio />
          </Form.Item>
        </Form>
      </DragModal>
    </span>
  );
}
