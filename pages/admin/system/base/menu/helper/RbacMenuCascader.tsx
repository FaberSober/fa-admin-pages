import React from 'react';
import { BaseCascader, BaseCascaderProps } from '@fa/ui';
import { Rbac } from '@/types';
import { rbacMenuApi } from '@features/fa-admin-pages/services';

export interface RbacMenuCascaderProps extends Omit<BaseCascaderProps<Rbac.RbacMenu, string>, 'serviceApi'> {}

/**
 * @author xu.pengfei
 * @date 2020/12/25
 */
export default function RbacMenuCascader(props: RbacMenuCascaderProps) {
  return <BaseCascader showRoot={false} serviceApi={rbacMenuApi} placeholder="请选择菜单" {...props} />;
}
