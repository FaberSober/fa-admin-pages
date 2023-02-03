import React, { useContext, useState } from 'react';
import { get } from 'lodash';
import { Button, Form, Input } from 'antd';
import {EditOutlined, PlusOutlined} from "@ant-design/icons";
import { DragModal, FaHref, ApiEffectLayoutContext, FaUtils, CommonModalProps } from '@fa/ui';
import { fileSaveApi as api } from '@/services';
import { Admin } from '@/types';


/**
 * BASE-用户文件表实体新增、编辑弹框
 */
export default function FileSaveModal({ children, title, record, fetchFinish, addBtn, editBtn, ...props }: CommonModalProps<Admin.FileSave>) {
  const {loadingEffect} = useContext(ApiEffectLayoutContext)
  const [form] = Form.useForm();

  const [open, setOpen] = useState(false);

  /** 新增Item */
  function invokeInsertTask(params: any) {
    api.save(params).then((res) => {
      FaUtils.showResponse(res, '新增BASE-用户文件表');
      setOpen(false);
      if (fetchFinish) fetchFinish();
    })
  }

  /** 更新Item */
  function invokeUpdateTask(params: any) {
    api.update(params.id, params).then((res) => {
      FaUtils.showResponse(res, '更新BASE-用户文件表');
      setOpen(false);
      if (fetchFinish) fetchFinish();
    })
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

  function getInitialValues() {
    return {
      url: get(record, 'url'),
      size: get(record, 'size'),
      filename: get(record, 'filename'),
      originalFilename: get(record, 'originalFilename'),
      basePath: get(record, 'basePath'),
      path: get(record, 'path'),
      ext: get(record, 'ext'),
      contentType: get(record, 'contentType'),
      platform: get(record, 'platform'),
      thUrl: get(record, 'thUrl'),
      thFilename: get(record, 'thFilename'),
      thSize: get(record, 'thSize'),
      thContentType: get(record, 'thContentType'),
      objectId: get(record, 'objectId'),
      objectType: get(record, 'objectType'),
      attr: get(record, 'attr'),
      md5: get(record, 'md5'),
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
        width={700}
        {...props}
      >
        <Form form={form} onFinish={onFinish}>
          <Form.Item name="url" label="文件访问地址" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="size" label="文件大小，单位字节" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="filename" label="文件名" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="originalFilename" label="原始文件名" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="basePath" label="基础存储路径" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="path" label="存储路径" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="ext" label="文件扩展名" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="contentType" label="MIME类型" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="platform" label="存储平台" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="thUrl" label="缩略图访问路径" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="thFilename" label="缩略图名称" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="thSize" label="缩略图大小，单位字节" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="thContentType" label="缩略图MIME类型" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="objectId" label="文件所属对象id" {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="objectType" label="文件所属对象类型，例如用户头像，评价图片" {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="attr" label="附加属性" {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="md5" label="文件MD5" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
        </Form>
      </DragModal>
    </span>
  )
}
