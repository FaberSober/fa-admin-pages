import { BaseBoolRadio, type CommonModalProps, DictEnumApiRadio, DragModal, Fa, FaEnums, FaUtils, useApiLoading } from '@fa/ui';
import IconSelect from '@features/fa-admin-pages/components/icons/IconSelect';
import RouteCascader from '@features/fa-admin-pages/components/route/RouteCascader';
import { rbacMenuApi as api } from '@features/fa-admin-pages/services';
import { Form, Input, Select } from 'antd';
import { get } from 'lodash';
import { useEffect, useState } from 'react';
import type { Rbac } from '@/types';
import RbacFlowMenuSelect from '../helper/RbacFlowMenuSelect';
import RbacMenuCascader from '../helper/RbacMenuCascader';

const serviceName = '菜单';

interface RbacMenuModalProps extends CommonModalProps<Rbac.RbacMenu> {
  scope: FaEnums.RbacMenuScopeEnum;
  parentId?: string;
}

/**
 * BASE-权限表实体新增、编辑弹框
 */
export default function RbacMenuModal({
  children,
  title,
  record,
  scope,
  parentId,
  fetchFinish,
  open: controlledOpen,
  onCancel,
  onOpen,
  ...props
}: RbacMenuModalProps) {
  const [form] = Form.useForm();

  const [internalOpen, setInternalOpen] = useState(false);
  const modalOpen = controlledOpen ?? internalOpen;
  const [level, setLevel] = useState<FaEnums.RbacMenuLevelEnum | undefined>(() => {
    return record ? record.level : FaEnums.RbacMenuLevelEnum.MENU;
  });
  const [linkType, setLinkType] = useState<FaEnums.RbacLinkTypeEnum | undefined>(() => {
    return record ? record.linkType : FaEnums.RbacLinkTypeEnum.INNER;
  });

  /** 新增Item */
  function invokeInsertTask(params: any) {
    api.save(params).then((res) => {
      FaUtils.showResponse(res, `新增${serviceName}`);
      closeModal();
      if (fetchFinish) fetchFinish();
    });
  }

  /** 更新Item */
  function invokeUpdateTask(params: any) {
    api.update(params.id, params).then((res) => {
      FaUtils.showResponse(res, `更新${serviceName}`);
      closeModal();
      if (fetchFinish) fetchFinish();
    });
  }

  /** 提交表单 */
  function onFinish(fieldsValue: any) {
    const formLevel = fieldsValue.level as FaEnums.RbacMenuLevelEnum;
    const values = {
      ...fieldsValue,
      scope,
      parentId: formLevel === FaEnums.RbacMenuLevelEnum.APP ? Fa.Constant.TREE_SUPER_ROOT_ID : fieldsValue.parentId,
      linkType: formLevel === FaEnums.RbacMenuLevelEnum.BUTTON ? FaEnums.RbacLinkTypeEnum.PATH : fieldsValue.linkType,
    };
    if (record) {
      invokeUpdateTask({ ...record, ...values });
    } else {
      invokeInsertTask({ ...values });
    }
  }

  function getInitialValues() {
    return {
      parentId: get(record, 'parentId', parentId),
      name: get(record, 'name'),
      level: get(record, 'level', FaEnums.RbacMenuLevelEnum.MENU),
      icon: get(record, 'icon'),
      status: get(record, 'status', true),
      linkType: get(record, 'linkType', FaEnums.RbacLinkTypeEnum.INNER),
      linkUrl: get(record, 'linkUrl'),
    };
  }

  function showModal() {
    if (controlledOpen === undefined) {
      setInternalOpen(true);
    }
    onOpen?.();
    setLevel(record ? record.level : FaEnums.RbacMenuLevelEnum.MENU);
    setLinkType(record ? record.linkType : FaEnums.RbacLinkTypeEnum.INNER);
    form.resetFields();
    form.setFieldsValue(getInitialValues());
  }

  function closeModal() {
    if (controlledOpen === undefined) {
      setInternalOpen(false);
    }
  }

  function handleValuesChange(changedValues: Record<string, any>) {
    if ('level' in changedValues) {
      const nextLevel = changedValues.level as FaEnums.RbacMenuLevelEnum;
      const previousLevel = level;
      setLevel(nextLevel);

      if (nextLevel === FaEnums.RbacMenuLevelEnum.BUTTON) {
        setLinkType(FaEnums.RbacLinkTypeEnum.PATH);
        form.setFieldsValue({ linkType: FaEnums.RbacLinkTypeEnum.PATH, linkUrl: '' });
      } else if (previousLevel === FaEnums.RbacMenuLevelEnum.BUTTON) {
        setLinkType(FaEnums.RbacLinkTypeEnum.INNER);
        form.setFieldsValue({ linkType: FaEnums.RbacLinkTypeEnum.INNER, linkUrl: '' });
      }

      if (nextLevel === FaEnums.RbacMenuLevelEnum.APP) {
        form.setFieldValue('parentId', Fa.Constant.TREE_SUPER_ROOT_ID);
      } else if (previousLevel === FaEnums.RbacMenuLevelEnum.APP) {
        form.setFieldValue('parentId', undefined);
      }
    }

    if ('linkType' in changedValues) {
      setLinkType(changedValues.linkType as FaEnums.RbacLinkTypeEnum);
    }
  }

  useEffect(() => {
    if (!modalOpen) return;
    setLevel(record ? record.level : FaEnums.RbacMenuLevelEnum.MENU);
    setLinkType(record ? record.linkType : FaEnums.RbacLinkTypeEnum.INNER);
    form.resetFields();
    form.setFieldsValue(getInitialValues());
  }, [modalOpen, record]);

  const loading = useApiLoading([api.getUrl('save'), api.getUrl('update')]);
  const isModule = level === FaEnums.RbacMenuLevelEnum.APP;
  const isButton = level === FaEnums.RbacMenuLevelEnum.BUTTON;

  return (
    <span>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: The wrapper delegates interaction to the child trigger control. */}
      <span onClick={showModal}>{children}</span>
      <DragModal
        title={title}
        open={modalOpen}
        onOk={() => form.submit()}
        confirmLoading={loading}
        onCancel={(event) => {
          closeModal();
          onCancel?.(event);
        }}
        width={700}
        {...props}
      >
        <Form form={form} onFinish={onFinish} onValuesChange={handleValuesChange} {...FaUtils.formItemFullLayout}>
          <Form.Item name="level" label="菜单等级" rules={[{ required: true }]}>
            <DictEnumApiRadio enumName="RbacMenuLevelEnum" />
          </Form.Item>
          {!isModule && (
            <Form.Item name="parentId" label="上级菜单" rules={[{ required: true }]}>
              <RbacMenuCascader
                showRoot={false}
                onChangeWithItem={(_: any, raw: Rbac.RbacMenu | undefined) => {
                  if (!isButton) {
                    form.setFieldValue('linkUrl', raw ? raw.linkUrl : '');
                  }
                }}
                disabledIds={record ? [record.id] : undefined}
                scope={scope}
              />
            </Form.Item>
          )}
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="是否启用" rules={[{ required: true }]}>
            <BaseBoolRadio />
          </Form.Item>
          {isButton ? (
            <Form.Item name="linkType" hidden>
              <Input type="hidden" />
            </Form.Item>
          ) : (
            <Form.Item name="linkType" label="链接类型" rules={[{ required: true }]}>
              <Select>
                <Select.Option value={FaEnums.RbacLinkTypeEnum.INNER}>内部链接</Select.Option>
                <Select.Option value={FaEnums.RbacLinkTypeEnum.OUT}>外部链接</Select.Option>
                <Select.Option value={FaEnums.RbacLinkTypeEnum.PATH}>自定义路径</Select.Option>
                <Select.Option value={FaEnums.RbacLinkTypeEnum.FA_FORM}>自定义表单</Select.Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item name="linkUrl" label={isButton ? '权限标识' : '链接地址'} rules={[{ required: true }]}>
            {isButton && <Input placeholder="请输入按钮权限标识，如：system:user:add" />}
            {!isButton && linkType === FaEnums.RbacLinkTypeEnum.INNER && <RouteCascader />}
            {!isButton && linkType === FaEnums.RbacLinkTypeEnum.OUT && <Input placeholder="请输入完整的外部链接地址，如：https://www.example.com/page" />}
            {!isButton && linkType === FaEnums.RbacLinkTypeEnum.PATH && <Input placeholder="请输入自定义路径，如：/custom/path" />}
            {!isButton && linkType === FaEnums.RbacLinkTypeEnum.FA_FORM && <RbacFlowMenuSelect />}
          </Form.Item>

          {!isButton && (
            <Form.Item name="icon" label="图标标识" rules={[{ required: false }]}>
              <IconSelect />
            </Form.Item>
          )}
        </Form>
      </DragModal>
    </span>
  );
}
