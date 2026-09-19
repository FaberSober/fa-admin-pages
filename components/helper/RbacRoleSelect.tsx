import { BaseSelect, type BaseSelectProps } from '@fa/ui';
import ConfigLayoutContext from '@features/fa-admin-pages/layout/config/context/ConfigLayoutContext';
import UserLayoutContext from '@features/fa-admin-pages/layout/user/context/UserLayoutContext';
import { rbacRoleApi as api } from '@features/fa-admin-pages/services';
import { useContext } from 'react';
import type { Rbac } from '@/types';

/**
 * @author xu.pengfei
 * @date 2022/9/28
 */
export default function RbacRoleSelect({ ...props }: Omit<BaseSelectProps<Rbac.RbacRole>, 'serviceApi'>) {
  const { systemConfig } = useContext(ConfigLayoutContext);
  const { user, selectedTenant } = useContext(UserLayoutContext);
  const serviceApi = {
    ...api,
    list: (params: any) =>
      api.list(params).then((res) => ({
        ...res,
        data: systemConfig.tenantEnabled
          ? res.data.filter((role) => (role.type !== 3 ? user.superAdmin : role.tenantId === selectedTenant?.tenantId))
          : res.data,
      })),
  };
  const extraParams = [...(props.extraParams || []), systemConfig.tenantEnabled, user.superAdmin, selectedTenant?.tenantId];
  return <BaseSelect {...props} serviceApi={serviceApi} extraParams={extraParams} placeholder="请选择角色" />;
}
