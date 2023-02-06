import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FieldNumberOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, Space } from 'antd';
import { trim } from 'lodash';
import { ApiEffectLayoutContext, Captcha, FaUtils } from '@fa/ui';
import { userApi } from '@/services'
import { Helmet } from "react-helmet-async";
import { ConfigLayoutContext, VantaLayout } from "@/layout";
import styles from '@features/fa-admin-pages/pages/login/login.module.scss';


const formItemLayout = { labelCol: { span: 5 }, wrapperCol: { span: 19 } };

export default function ForgetPwd() {
  const {loadingEffect} = useContext(ApiEffectLayoutContext);
  const {systemConfig} = useContext(ConfigLayoutContext);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [code, setCode] = useState('');

  function onFinish(fieldsValue: any) {
    userApi.forgetResetPwd(fieldsValue).then((res) => {
      FaUtils.showResponse(res, '重置密码')
      navigate('/login');
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

  function validateNewPwdConfirm(_rule: any, value: any) {
    const newPwd = form.getFieldValue('password');
    if (newPwd !== value) {
      return Promise.reject('两次输入密码不一致');
    }
    return Promise.resolve();
  }

  const loading = loadingEffect[userApi.getUrl('forgetResetPwd')];
  return (
    <VantaLayout>
      <Helmet title={`重置密码 | ${systemConfig?.title}`}/>

      <div className={styles.title}>重置密码</div>
      <Form form={form} onFinish={onFinish}>
        <Form.Item label="账号" name="username" rules={[{required: true, message: '请输入账号'}]} {...formItemLayout}>
          <Input size="large" prefix={<UserOutlined/>} placeholder="请输入账号"/>
        </Form.Item>
        <Form.Item label="手机号" name="tel" rules={[{required: true, message: '请输入手机号'}, FaUtils.FormRules.PATTERN_TEL]} {...formItemLayout}>
          <Input size="large" prefix={<UserOutlined/>} placeholder="请输入手机号"/>
        </Form.Item>
        <Form.Item label="密码" name="password" rules={[{required: true, message: '请输入密码'}]} {...formItemLayout}>
          <Input.Password size="large" prefix={<LockOutlined/>} type="password" placeholder="请输入密码"/>
        </Form.Item>
        <Form.Item
          label="密码确认"
          name="passwordConfirm"
          rules={[{ required: true }, { validator: validateNewPwdConfirm }]}
          {...formItemLayout}
        >
          <Input.Password size="large" prefix={<LockOutlined/>} type="password" placeholder="请再次输入新密码" />
        </Form.Item>

        {systemConfig?.safeCaptchaOn && (
          <Form.Item label="验证码" name="captcha" rules={[{required: true, message: '请输入验证码'}, {validator: validateCaptcha}]} {...formItemLayout}>
            <Input
              size="large"
              prefix={<FieldNumberOutlined/>}
              placeholder="请输入验证码"
              addonAfter={<Captcha onCodeChange={(c) => setCode(c)}/>}
            />
          </Form.Item>
        )}
        <Button size="large" block loading={loading} className={styles.submit} type="primary" htmlType="submit">
          重置密码
        </Button>

        <Space className="fa-flex-row-center fa-mt12">
          <a href="/login">返回登录</a>
        </Space>
      </Form>
    </VantaLayout>
  );
}
