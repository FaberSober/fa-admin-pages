import React, { useContext } from 'react';
import { ConfigLayoutContext, VantaLayout } from "@features/fa-admin-pages/layout";
import { fileSaveApi } from "@fa/ui";
import LoginCuteLayout from "./layout/LoginCuteLayout";
import LoginForm from "./cube/LoginForm";
import './login.scss'


/**
 * 登录页面
 * @author xu.pengfei
 * @date 2023/7/30 15:55
 */
export default function index() {
  const {systemConfig} = useContext(ConfigLayoutContext);

  switch (systemConfig.loginPageType) {
    case 'cute':
  }

  if (systemConfig.loginPageType === 'cute') {
    return (
      <LoginCuteLayout>
        <div className="fa-login-cute-management">
          <div className="fa-login-cute-managementTop">
            <img src={fileSaveApi.genLocalGetFile(systemConfig.logoWithText)} alt={systemConfig.title} style={{height: '100%'}}/>
          </div>

          <LoginForm/>

          <div className="fa-login-cute-managementBottom">
            {systemConfig.cop}
          </div>
        </div>
      </LoginCuteLayout>
    )
  }

  return (
    <VantaLayout>
      <div className="fa-login-cute-management">
        <div className="fa-login-cute-managementTop">
          <img src={fileSaveApi.genLocalGetFile(systemConfig.logoWithText)} alt={systemConfig.title} style={{height: '100%'}}/>
        </div>

        <LoginForm/>

        <div className="fa-login-cute-managementBottom">
          {systemConfig.cop}
        </div>
      </div>
    </VantaLayout>
  )
}
