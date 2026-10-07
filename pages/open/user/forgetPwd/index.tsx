import React, { useContext } from 'react';
import SystemLogo from '@features/fa-admin-pages/components/icons/SystemLogo';
import ConfigLayoutContext from '@features/fa-admin-pages/layout/config/context/ConfigLayoutContext';
import VantaLayout from '@features/fa-admin-pages/layout/effect/VantaLayout';
import LoginCuteLayout from '@features/fa-admin-pages/pages/login/layout/LoginCuteLayout';
import '@features/fa-admin-pages/pages/login/login.scss';
import MainForm from './cube/ForgetPwdForm';

/**
 * 忘记密码
 * @author xu.pengfei
 * @date 2023/7/30 15:55
 */
export default function ForgetPwd() {
  const { systemConfig } = useContext(ConfigLayoutContext);

  switch (systemConfig.loginPageType) {
    case 'cute':
  }

  if (systemConfig.loginPageType === 'cute') {
    return (
      <LoginCuteLayout>
        <div className="fa-login-cute-main">
          <div className="fa-login-cute-main-top">
            <SystemLogo fileId={systemConfig.logoWithText} alt={systemConfig.title} style={{ height: '100%' }} />
          </div>

          <MainForm />

          <div className="fa-login-cute-main-bottom">{systemConfig.cop}</div>
        </div>
      </LoginCuteLayout>
    );
  }

  return (
    <VantaLayout>
      <div className="fa-login-cute-main">
        <div className="fa-login-cute-main-top">
          <SystemLogo fileId={systemConfig.logoWithText} alt={systemConfig.title} style={{ height: '100%' }} />
        </div>

        <MainForm />

        <div className="fa-login-cute-main-bottom">{systemConfig.cop}</div>
      </div>
    </VantaLayout>
  );
}
