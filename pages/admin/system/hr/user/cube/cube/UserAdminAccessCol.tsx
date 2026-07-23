import { userApi as api } from '@features/fa-admin-pages/services';
import type { Admin } from '@features/fa-admin-pages/types';
import { Switch } from 'antd';
import { useState } from 'react';

export interface UserAdminAccessColProps {
  item: Admin.User;
  onChange: (item: Admin.User) => void;
}

export default function UserAdminAccessCol({ item, onChange }: UserAdminAccessColProps) {
  const [loading, setLoading] = useState(false);

  function handleUpdate(adminEnabled: boolean) {
    setLoading(true);
    api
      .updateSimpleById(item.id, { adminEnabled })
      .then(() => onChange({ ...item, adminEnabled }))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }

  return (
    <Switch
      checked={item.adminEnabled}
      checkedChildren="允许"
      disabled={item.superAdmin}
      loading={loading}
      onChange={handleUpdate}
      title={item.superAdmin ? '超级管理员必须保留后台访问资格' : undefined}
      unCheckedChildren="禁止"
    />
  );
}
