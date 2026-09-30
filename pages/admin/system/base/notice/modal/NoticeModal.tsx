import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { type Admin, BaseBoolRadio, BaseTinyMCE, type CommonModalProps, FaFullContentModal, FaHref, FaUtils, useApiLoading } from '@fa/ui';
import { noticeApi as api } from '@features/fa-admin-pages/services';
import { Button, Form, Input } from 'antd';
import { get } from 'lodash';
import { useContext, useState } from 'react';
import ConfigLayoutContext from '@features/fa-admin-pages/layout/config/context/ConfigLayoutContext';
import UserLayoutContext from '@features/fa-admin-pages/layout/user/context/UserLayoutContext';
import './NoticeModal.css';

const serviceName = '通知与公告';

/**
 * BASE-通知与公告实体新增、编辑弹框
 */
export default function NoticeModal({ children, title, record, fetchFinish, addBtn, editBtn }: CommonModalProps<Admin.Notice>) {
  const [form] = Form.useForm();
  const { systemConfig } = useContext(ConfigLayoutContext);
  const { selectedTenant } = useContext(UserLayoutContext);
  const tenantId = record ? record.tenantId : selectedTenant?.tenantId;
  const tenantLabel = tenantId === selectedTenant?.tenantId && tenantId
    ? selectedTenant?.tenantName || tenantId
    : tenantId || (record ? '未分配（历史公告）' : '请先切换租户');

  const [open, setOpen] = useState(false);

  /** 新增Item */
  function invokeInsertTask(params: any) {
    api.save(params).then((res) => {
      FaUtils.showResponse(res, `新增${serviceName}`);
      setOpen(false);
      if (fetchFinish) fetchFinish();
    });
  }

  /** 更新Item */
  function invokeUpdateTask(params: any) {
    api.update(params.id, params).then((res) => {
      FaUtils.showResponse(res, `更新${serviceName}`);
      setOpen(false);
      if (fetchFinish) fetchFinish();
    });
  }

  /** 提交表单 */
  function onFinish(fieldsValue: any) {
    if (!record && systemConfig.tenantEnabled && !selectedTenant?.tenantId) return;
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

  function getInitialValues() {
    return {
      title: get(record, 'title'),
      content: get(record, 'content'),
      status: get(record, 'status'),
      forApp: get(record, 'forApp'),
      strongNotice: get(record, 'strongNotice'),
    };
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      form.setFieldsValue(getInitialValues());
    }
  }

  const loading = useApiLoading([api.getUrl('save'), api.getUrl('update')]);
  const triggerDom = (
    <span>
      {children}
      {addBtn && (
        <Button icon={<PlusOutlined />} type="primary">
          新增
        </Button>
      )}
      {editBtn && <FaHref icon={<EditOutlined />} text="编辑" />}
    </span>
  );

  return (
    <FaFullContentModal
      title={title}
      triggerDom={triggerDom}
      open={open}
      onOpenChange={handleOpenChange}
      onOk={() => form.submit()}
      confirmLoading={loading}
      showOk={!!record || !systemConfig.tenantEnabled || !!selectedTenant?.tenantId}
      onCancel={() => setOpen(false)}
    >
      <div className="notice-form-content">
        <div className="notice-form-shell">
          <Form form={form} onFinish={onFinish} className="notice-form">
            {systemConfig.tenantEnabled && (
              <Form.Item label="所属租户" {...FaUtils.formItemFullLayout}>
                <Input value={tenantLabel} readOnly />
              </Form.Item>
            )}
            <Form.Item name="title" label="标题" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
              <Input maxLength={50} />
            </Form.Item>
            <Form.Item name="content" label="内容" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
              <BaseTinyMCE style={{ height: 500 }} />
            </Form.Item>
            <Form.Item name="status" label="是否有效" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
              <BaseBoolRadio />
            </Form.Item>
            <Form.Item name="strongNotice" label="是否强提醒" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
              <BaseBoolRadio />
            </Form.Item>
          </Form>
        </div>
      </div>
    </FaFullContentModal>
  );
}
