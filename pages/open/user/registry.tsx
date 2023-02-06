import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FieldNumberOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, Space } from 'antd';
import { trim } from 'lodash';
import { ApiEffectLayoutContext, Captcha, LoginMode, setLoginMode, setToken } from '@fa/ui';
import { authApi } from '@/services'
import { SITE_INFO } from '@/configs';
import { Helmet } from "react-helmet-async";
import { ConfigLayoutContext } from "@/layout";
import styles from '@features/fa-admin-pages/pages/login/login.module.scss';


export default function Login() {
  const vantaRef = useRef<any>();
  const { loadingEffect } = useContext(ApiEffectLayoutContext);
  const { systemConfig } = useContext(ConfigLayoutContext);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [code, setCode] = useState('');

  useEffect(() => {
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
    <div ref={vantaRef} className={styles['main-container']}>
      <Helmet title={`注册 | ${systemConfig?.title}`} />

      <div className={styles.bannerDiv}>
        <div className={styles.bannerTitle}>{systemConfig?.title || '-'}</div>
        <div className={styles.bannerSubTitle}>{systemConfig?.subTitle || '-'}</div>
      </div>

      <div className={styles.loginContainer}>
        <div className={styles.title}>用户注册</div>
        <Form form={form} onFinish={onFinish}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入账号' }]}>
            <Input size="large" prefix={<UserOutlined />} placeholder="请输入账号" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password size="large" prefix={<LockOutlined />} type="password" placeholder="请输入密码" />
          </Form.Item>
          {systemConfig?.safeCaptchaOn && (
            <Form.Item name="captcha" rules={[{ required: true, message: '请输入验证码' }, { validator: validateCaptcha }]}>
              <Input
                size="large"
                prefix={<FieldNumberOutlined />}
                placeholder="请输入验证码"
                addonAfter={<Captcha onCodeChange={(c) => setCode(c)} />}
              />
            </Form.Item>
          )}
          <Button size="large" block loading={loading} className={styles.submit} type="primary" htmlType="submit">
            登录
          </Button>

          <Space className="fa-flex-row-center fa-mt12">
            <a href="/login">返回登录</a>
          </Space>
        </Form>
      </div>
    </div>
  );
}
