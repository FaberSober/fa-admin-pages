import React, { useContext } from 'react';
import { ConfigLayoutContext } from "@features/fa-admin-pages/layout";
import PageDefault from './cube/default'
import PageCute from './cube/cute'


/**
 * 忘记密码
 * @author xu.pengfei
 * @date 2023/7/30 15:55
 */
export default function index() {
  const { systemConfig } = useContext(ConfigLayoutContext);

  switch (systemConfig.loginPageType) {
    case 'cute':
      return <PageCute />
  }

  return <PageDefault />
}
