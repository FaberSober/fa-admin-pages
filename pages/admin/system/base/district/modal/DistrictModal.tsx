import React, { useContext, useState, useEffect } from 'react';
import { get } from 'lodash';
import { Button, Form, Input, Select } from 'antd';
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { DragModal, FaHref, ApiEffectLayoutContext, FaUtils, CommonModalProps } from '@fa/ui';
import { districtApi as api } from '@/services';
import { userApi } from '@features/fa-admin-pages/services';
import { Htm, Admin } from '@/types';

const { TextArea } = Input;

/** 状态枚举 */
const STATUS_OPTIONS = [
  { label: '禁用', value: 0 },
  { label: '启用', value: 1 },
];

/**
 * 辖区管理实体新增、编辑弹框
 */
export default function DistrictModal({ children, title, record, fetchFinish, addBtn, editBtn, ...props }: CommonModalProps<Htm.District>) {
  const {loadingEffect} = useContext(ApiEffectLayoutContext)
  const [form] = Form.useForm();

  const [open, setOpen] = useState(false);
  const [userList, setUserList] = useState<Admin.User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // 加载用户列表
  useEffect(() => {
    if (open) {
      loadUserList();
    }
  }, [open]);

  async function loadUserList() {
    setLoadingUsers(true);
    try {
      const res = await userApi.list({});
      if (res && res.data) {
        setUserList(res.data);
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
    } finally {
      setLoadingUsers(false);
    }
  }

  /** 新增Item */
  function invokeInsertTask(params: any) {
    api.save(params).then((res) => {
      FaUtils.showResponse(res, '新增辖区');
      setOpen(false);
      if (fetchFinish) fetchFinish();
    })
  }

  /** 更新Item */
  function invokeUpdateTask(params: any) {
    api.update(params.id, params).then((res) => {
      FaUtils.showResponse(res, '更新辖区');
      setOpen(false);
      if (fetchFinish) fetchFinish();
    })
  }

  /** 提交表单 */
  function onFinish(fieldsValue: any) {
    const values = {
      ...fieldsValue,
    };
    if (record) {
      invokeUpdateTask({ ...record, ...values });
    } else {
      invokeInsertTask({ ...values });
    }
  }

  function getInitialValues() {
    return {
      code: get(record, 'code'),
      name: get(record, 'name'),
      responsiblePerson: get(record, 'responsiblePerson'),
      responsibleTel: get(record, 'responsibleTel'),
      geoFence: get(record, 'geoFence'),
      status: get(record, 'status', 1),
      remark: get(record, 'remark'),
    }
  }

  function showModal() {
    setOpen(true)
    form.setFieldsValue(getInitialValues())
  }

  const loading = loadingEffect[api.getUrl('save')] || loadingEffect[api.getUrl('update')];
  return (
    <span>
      <span onClick={showModal}>
        {children}
        {addBtn && <Button icon={<PlusOutlined />} type="primary">新增</Button>}
        {editBtn && <FaHref icon={<EditOutlined />} text="编辑" />}
      </span>
      <DragModal
        title={title}
        open={open}
        onOk={() => form.submit()}
        confirmLoading={loading}
        onCancel={() => setOpen(false)}
        width={800}
        {...props}
      >
        <Form form={form} onFinish={onFinish} {...FaUtils.formItemFullLayout}>
          {record && (
            <Form.Item name="code" label="辖区编码">
              <Input placeholder="系统自动生成" disabled />
            </Form.Item>
          )}
          
          <Form.Item name="name" label="辖区名称" rules={[{ required: true, message: '请输入辖区名称' }]}>
            <Input placeholder="请输入辖区名称" />
          </Form.Item>
          
          <Form.Item name="responsiblePerson" label="负责人">
            <Select 
              placeholder="请选择负责人" 
              showSearch
              allowClear
              loading={loadingUsers}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={userList.map(user => ({ label: user.name, value: user.id }))}
            />
          </Form.Item>
          
          <Form.Item name="responsibleTel" label="负责人电话">
            <Input placeholder="请输入负责人电话" />
          </Form.Item>
          
          <Form.Item 
            name="geoFence" 
            label="电子围栏" 
            tooltip="请输入JSON格式的经纬度数组，例如：[{&quot;lng&quot;:116.404,&quot;lat&quot;:39.915},{&quot;lng&quot;:117.200,&quot;lat&quot;:39.084}]"
            rules={[
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  try {
                    JSON.parse(value);
                    return Promise.resolve();
                  } catch (error) {
                    return Promise.reject(new Error('请输入有效的JSON格式'));
                  }
                }
              }
            ]}
          >
            <TextArea 
              placeholder='请输入JSON格式的经纬度数组，例如：[{"lng":116.404,"lat":39.915},{"lng":117.200,"lat":39.084}]' 
              rows={6}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
          
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select placeholder="请选择状态" options={STATUS_OPTIONS} />
          </Form.Item>
          
          <Form.Item name="remark" label="备注">
            <TextArea placeholder="请输入备注" rows={3} />
          </Form.Item>
        </Form>
      </DragModal>
    </span>
  )
}

