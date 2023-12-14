import React, { useContext, useEffect, useState } from 'react';
import { get } from 'lodash';
import { Form, Input, Select } from 'antd';
import { ApiEffectLayoutContext, BaseBoolRadio, CommonModalProps, DictEnumApiRadio, DragModal, FaEnums, FaUtils } from '@fa/ui';
import { IconSelect, RouteCascader } from "@/components";
import { Rbac } from '@/types';
import { rbacMenuApi } from "@/services";
import RbacMenuCascader from '../helper/RbacMenuCascader';

const serviceName = '菜单';

/**
 * BASE-权限表实体新增、编辑弹框
 */
export default function RbacMenuModal({ children, title, record, fetchFinish, ...props }: CommonModalProps<Rbac.RbacMenu>) {
  const { loadingEffect } = useContext(ApiEffectLayoutContext);
  const [form] = Form.useForm();

  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<FaEnums.RbacMenuLevelEnum|undefined>(() => {
    return record ? record.level : undefined;
  });
  const [linkType, setLinkType] = useState<FaEnums.RbacLinkTypeEnum|undefined>(() => {
    return record ? record.linkType : undefined;
  });

  /** 新增Item */
  function invokeInsertTask(params: any) {
    rbacMenuApi.save(params).then((res) => {
      FaUtils.showResponse(res, `新增${serviceName}`);
      setOpen(false);
      if (fetchFinish) fetchFinish();
    });
  }

  /** 更新Item */
  function invokeUpdateTask(params: any) {
    rbacMenuApi.update(params.id, params).then((res) => {
      FaUtils.showResponse(res, `更新${serviceName}`);
      setOpen(false);
      if (fetchFinish) fetchFinish();
    });
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
      parentId: get(record, 'parentId'),
      name: get(record, 'name'),
      level: get(record, 'level', FaEnums.RbacMenuLevelEnum.MENU),
      icon: get(record, 'icon'),
      status: get(record, 'status', true),
      linkType: get(record, 'linkType', FaEnums.RbacLinkTypeEnum.INNER),
      linkUrl: get(record, 'linkUrl'),
    };
  }

  function showModal() {
    setOpen(true);
    setLevel(record ? record.level : undefined)
    form.setFieldsValue(getInitialValues());
  }

  useEffect(() => {
    setLevel(record ? record.level : undefined)
    form.setFieldsValue(getInitialValues());
  }, [record]);

  const loading = loadingEffect[rbacMenuApi.getUrl('save')] || loadingEffect[rbacMenuApi.getUrl('update')];
  return (
    <span>
      <span onClick={showModal}>{children}</span>
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
          onValuesChange={(cv:any) => {
            if (cv.level) {
              setLevel(cv.level)
            }
            if (cv.linkType) {
              setLinkType(cv.linkType)
            }
          }}
        >
          <Form.Item name="level" label="菜单等级" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <DictEnumApiRadio enumName="RbacMenuLevelEnum" />
          </Form.Item>
          <Form.Item name="parentId" label="上级菜单" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <RbacMenuCascader
              showRoot
              onChangeWithItem={(_: any, raw: Rbac.RbacMenu|undefined) => {
                form.setFieldValue('linkUrl', raw ? raw.linkUrl : '');
              }}
              disabledIds={record ? [record.id] : undefined}
            />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="是否启用" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <BaseBoolRadio />
          </Form.Item>
          <Form.Item name="linkType" label="链接类型" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Select>
              <Select.Option value={FaEnums.RbacLinkTypeEnum.INNER}>内部链接</Select.Option>
              <Select.Option value={FaEnums.RbacLinkTypeEnum.OUT}>外部链接</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="linkUrl" label="链接地址" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            {(linkType === FaEnums.RbacLinkTypeEnum.OUT || level === FaEnums.RbacMenuLevelEnum.BUTTON) ? <Input placeholder="请输入菜单的权限点" /> : <RouteCascader />}
          </Form.Item>

          <Form.Item name="icon" label="图标标识" rules={[{ required: false }]} {...FaUtils.formItemFullLayout}>
            <IconSelect />
          </Form.Item>
        </Form>
      </DragModal>
    </span>
  );
}
