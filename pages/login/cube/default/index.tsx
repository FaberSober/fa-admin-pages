import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FieldNumberOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, Space } from 'antd';
import { trim } from 'lodash';
import { ApiEffectLayoutContext, Captcha, LoginMode, setLoginMode, setToken } from '@fa/ui';
import { authApi } from '@/services'
import { SITE_INFO } from '@/configs';
import styles from './login.module.scss';
import { Helmet } from "react-helmet-async";
import { ConfigLayoutContext, VantaLayout } from "@/layout";


export default function Login() {
  const { loadingEffect } = useContext(ApiEffectLayoutContext);
  const { systemConfig } = useContext(ConfigLayoutContext);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [code, setCode] = useState('');

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
    <VantaLayout>
      <Helmet title={`登录 | ${systemConfig.title}`} />

      <div className={styles.title}>用户登录</div>
      <Form form={form} onFinish={onFinish}>
        <Form.Item name="username" rules={[{ required: true, message: '请输入账号' }]}>
          <Input size="large" prefix={<UserOutlined />} placeholder="请输入账号" />
        </Form.Item>
        <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
          <Input.Password size="large" prefix={<LockOutlined />} type="password" placeholder="请输入密码" />
        </Form.Item>
        {systemConfig.safeCaptchaOn && (
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
          {systemConfig.safeRegistrationOn && <a href="/open/user/registry">注册账户</a>}
          <a href="/open/user/forgetPwd">忘记密码？</a>
        </Space>
      </Form>
    </VantaLayout>
  );
}
