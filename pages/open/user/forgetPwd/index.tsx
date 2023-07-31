import React, { useContext } from 'react';
import { ConfigLayoutContext } from "@features/fa-admin-pages/layout";
import ForgetPwdDefault from './cube/default'
import ForgetPwdCute from './cube/cute'


/**
 * 忘记密码
 * @author xu.pengfei
 * @date 2023/7/30 15:55
 */
export default function index() {
  const { systemConfig } = useContext(ConfigLayoutContext);

  switch (systemConfig.loginPageType) {
    case 'cute':
      return <ForgetPwdCute />
  }

  return <ForgetPwdDefault />
}
