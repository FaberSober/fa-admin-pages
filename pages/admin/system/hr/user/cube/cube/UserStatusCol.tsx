import { useState } from 'react';
import type { Admin } from '@features/fa-admin-pages/types';
import { userApi as api } from '@features/fa-admin-pages/services';
import { Fa, FaUtils } from '@fa/ui';
import { message, Switch } from 'antd';

export interface UserStatusColProps {
  item: Admin.User;
  onChange: (i: Admin.User) => void;
}

/**
 * @author xu.pengfei
 * @date 2024/1/17 16:03
 */
export default function UserStatusCol({ item, onChange }: UserStatusColProps) {
  const [loading, setLoading] = useState(false);
  const statusLocked = item.superAdmin === true;

  function handleEnableUpdate(status: boolean) {
    if (statusLocked && !status) return;

    setLoading(true);
    api
      .updateSimpleById(item.id, { id: item.id, status })
      .then((res: Fa.Ret) => {
        if (res?.status !== Fa.RES_CODE.OK) {
          message.error(res?.message || '更新账户状态失败');
          return;
        }
        FaUtils.showResponse(res, '更新账户状态');
        onChange({ ...item, status });
      })
      .catch(() => message.error('更新账户状态失败，请重试'))
      .finally(() => setLoading(false));
  }

  return (
    <Switch
      checkedChildren="有效"
      unCheckedChildren="禁止"
      checked={statusLocked || item.status}
      disabled={statusLocked}
      title={statusLocked ? '超级管理员账户必须保持有效' : undefined}
      onChange={(e) => handleEnableUpdate(e)}
      loading={loading}
    />
  );
}
