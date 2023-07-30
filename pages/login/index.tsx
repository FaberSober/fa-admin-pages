import React, { useContext } from 'react';
import { ConfigLayoutContext } from "@features/fa-admin-pages/layout";
import LoginDefault from './cube/default'
import LoginCute from './cube/cute'


/**
 * 登录页面
 * @author xu.pengfei
 * @date 2023/7/30 15:55
 */
export default function index() {
  const { systemConfig } = useContext(ConfigLayoutContext);

  switch (systemConfig.loginPageType) {
    case 'cute':
      return <LoginCute />
  }

  return <LoginDefault />
}
