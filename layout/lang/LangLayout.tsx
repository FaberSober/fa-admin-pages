import React, { createContext, useEffect, useState } from 'react';
import { ConfigProvider } from 'antd';
// dayjs国际化
import dayjs from 'dayjs'
import 'dayjs/esm/locale/zh-cn';
// antd国际化配置
import zhCN from 'antd/es/locale/zh_CN';
import enUS from 'antd/es/locale/en_US';
// i18n国际化
import { IntlProvider } from 'react-intl';
import zhCNMessage from '@/lang/zh_CN';
import enCNMessage from '@/lang/en_US';
import { SmileOutlined } from '@ant-design/icons';
import { Fa } from '@fa/ui';
import { useLocalStorage } from 'react-use';

dayjs.locale('zh-cn');

function handleAntdMessages(lang: string) {
  switch (lang) {
    case 'zh_CN':
      return zhCN;
    case 'en_US':
      return enUS;
    default:
      return zhCN;
  }
}

function handleMessages(lang: string) {
  switch (lang) {
    case 'zh_CN':
      return zhCNMessage;
    case 'en_US':
      return enCNMessage;
    default:
      return zhCNMessage;
  }
}

export interface LangContextProps {
  locale: string;
  setLocale: (locale: string) => void;
  setColorPrimary: (color: string) => void;
}

export const LangContext = createContext<LangContextProps>({
  locale: 'zh_CN',
  setLocale: () => {
    console.log('LangContext.setLocale');
  },
  setColorPrimary: () => {
    console.log('LangContext.setLocale');
  },
});

// 全局表单提示校验
const validateMessages = {
  // eslint-disable-next-line no-template-curly-in-string
  required: "'${label}' 是必选字段",
};

// 自定义Empty组件内容
const customizeRenderEmpty = () => (
  <div style={{ textAlign: 'center' }}>
    <SmileOutlined style={{ fontSize: 20 }} />
    <div>暂无数据</div>
  </div>
);

/**
 * 国际化组件
 */
function LangLayout({ children }: Fa.BaseChildProps) {
  const [locale, setLocale] = useState('zh_CN');
  const [colorPrimary, setColorPrimary] = useLocalStorage<string>('colorPrimary', '#0a72fa');

  useEffect(() => {
    const rootDom = document.getElementsByTagName('body')[0].style;
    rootDom.setProperty('--primary-color', colorPrimary!);
  }, []);

  return (
    <LangContext.Provider
      value={{
        locale,
        setLocale: (v) => setLocale(v),
        setColorPrimary,
      }}
    >
      <ConfigProvider
        locale={handleAntdMessages(locale)}
        form={{ validateMessages }}
        renderEmpty={customizeRenderEmpty}
        theme={{ token: { borderRadius: 3, colorPrimary: colorPrimary } }}
        // getPopupContainer={(trigger) => (trigger ? trigger.parentElement : document.body)}
      >
        <IntlProvider messages={handleMessages(locale)} locale={locale.split('_')[0]}>
          {children}
        </IntlProvider>
      </ConfigProvider>
    </LangContext.Provider>
  );
}

export default LangLayout;
