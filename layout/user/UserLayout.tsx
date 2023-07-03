import React, {createContext, useContext, useEffect, useState} from 'react';
import { Admin, Rbac } from '@/types';
import Favicon from 'react-favicon'
import { clearToken, Fa, PageLoading } from "@fa/ui";
import { authApi, fileSaveApi, msgApi, rbacUserRoleApi, userApi } from '@/services';
import {ConfigLayoutContext} from "@features/fa-admin-pages/layout";


export interface UserLayoutContextProps {
  user: Admin.User;
  roles: Rbac.RbacRole[];
  refreshUser: () => void; // 刷新用户
  logout: () => void; // 登出
  unreadCount: number;
  refreshUnreadCount: () => void;
}

export const UserLayoutContext = createContext<UserLayoutContextProps>({} as any);

/**
 * 登录后的用户上下文
 * @author xu.pengfei
 * @date 2022/9/21
 */
export default function UserLayout({ children }: Fa.BaseChildProps) {
  const {systemConfig} = useContext(ConfigLayoutContext)

  const [user, setUser] = useState<Admin.User>();
  const [roles, setRoles] = useState<Rbac.RbacRole[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    refreshUser();
    rbacUserRoleApi.getMyRoles().then((res) => setRoles(res.data));
  }, []);

  function refreshUser() {
    userApi.getLoginUser().then((res) => setUser(res.data));
  }

  function logout() {
    authApi.logout().then(res => {
      clearToken();
      window.location.href = res.data;
    })
  }

  function refreshUnreadCount() {
    msgApi.countMine().then((res) => setUnreadCount(res.data.unreadCount));
  }

  if (user === undefined) return <PageLoading />;
  if (systemConfig === undefined) return <PageLoading />;

  const contextValue: UserLayoutContextProps = {
    user,
    roles,
    refreshUser,
    logout,
    unreadCount,
    refreshUnreadCount,
  };

  return (
    <UserLayoutContext.Provider value={contextValue}>
      {systemConfig && systemConfig.logo && <Favicon url={fileSaveApi.genLocalGetFilePreview(systemConfig.logo)} />}
      {children}
    </UserLayoutContext.Provider>
  );
}
