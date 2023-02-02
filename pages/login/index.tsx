import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FieldNumberOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
import { trim } from 'lodash';
import { ApiEffectLayoutContext, Captcha, LoginMode, setLoginMode, setToken } from '@fa/ui';
import { authApi, configSysApi, fileSaveApi } from '@/services'
import { SITE_INFO } from '@/configs';
import styles from './login.module.scss';
import { Admin } from '@/types';
import Favicon from "react-favicon";
import { Helmet, HelmetProvider } from "react-helmet-async";


export default function Login() {
  const vantaRef = useRef<any>();
  const { loadingEffect } = useContext(ApiEffectLayoutContext);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [systemConfig, setSystemConfig] = useState<Admin.SystemConfigPo>();
  const [code, setCode] = useState('');

  useEffect(() => {
    // 获取系统配置参数
    configSysApi.getSystemConfig().then((res) => setSystemConfig(res.data));

    // 使用vanta制作背景效果图
    const vantaEffect = window.VANTA.WAVES({
      el: vantaRef.current,
      // THREE: THREE, // use a custom THREE when initializing
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
      zoom: 0.79,
    });
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, []);

  function onFinish(fieldsValue: any) {
    authApi.login(fieldsValue.username, fieldsValue.password).then((res) => {
      setToken(res.data);
      setLoginMode(LoginMode.LOCAL)
      navigate(SITE_INFO.HOME_LINK);
    });
  }

  function validateCaptcha(_: any, value: any) {
    if (value === undefined) {
      return Promise.resolve();
    }
    if (trim(value).toLowerCase() !== trim(code).toLowerCase()) {
      return Promise.reject('验证码输入错误');
    }
    return Promise.resolve();
  }

  const loading = loadingEffect[authApi.getUrl('login')];
  return (
    <HelmetProvider>
      <Helmet title={`登录 | ${systemConfig?.title}`} />

      <div ref={vantaRef} className={styles['main-container']}>
        {systemConfig && systemConfig.logo && <Favicon url={fileSaveApi.genLocalGetFilePreview(systemConfig.logo)} />}

        <div className={styles.bannerDiv}>
          <div className={styles.bannerTitle}>{systemConfig?.title || '-'}</div>
          <div className={styles.bannerSubTitle}>{systemConfig?.subTitle || '-'}</div>
        </div>

        <div className={styles.loginContainer}>
          <div className={styles.title}>用户登录</div>
          <Form form={form} onFinish={onFinish}>
            <Form.Item name="username" rules={[{ required: true, message: '请输入账号' }]}>
              <Input size="large" prefix={<UserOutlined />} placeholder="请输入账号" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password size="large" prefix={<LockOutlined />} type="password" placeholder="请输入密码" />
            </Form.Item>
            <Form.Item name="captcha" rules={[{ required: true, message: '请输入验证码' }, { validator: validateCaptcha }]}>
              <Input
                size="large"
                prefix={<FieldNumberOutlined />}
                placeholder="请输入验证码"
                addonAfter={<Captcha onCodeChange={(c) => setCode(c)} />}
              />
            </Form.Item>
            <Button size="large" block loading={loading} className={styles.submit} type="primary" htmlType="submit">
              登录
            </Button>
          </Form>
        </div>
      </div>
    </HelmetProvider>
  );
}
