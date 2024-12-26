import React from 'react';
import { BaseCascader, BaseCascaderProps, FaEnums } from '@fa/ui';
import { Rbac } from '@/types';
import { rbacMenuApi } from '@features/fa-admin-pages/services';

export interface RbacMenuCascaderProps extends Omit<BaseCascaderProps<Rbac.RbacMenu, string>, 'serviceApi'> {
  scope: FaEnums.RbacMenuScopeEnum;
}

/**
 * @author xu.pengfei
 * @date 2020/12/25
 */
export default function RbacMenuCascader({scope, ...props}: RbacMenuCascaderProps) {
  return (
    <BaseCascader
      showRoot={false}
      serviceApi={{
        ...rbacMenuApi,
        allTree: () => rbacMenuApi.getTree({ query: { scope } }),
      }}
      placeholder="请选择菜单"
      extraParams={[scope]}
      {...props}
    />
  );
}
