import React, {createContext, useEffect, useState} from 'react';
import {ConfigProvider, theme} from 'antd';
import {each} from 'lodash'

// antd国际化配置
import zhCN from 'antd/es/locale/zh_CN';
import enUS from 'antd/es/locale/en_US';

// i18n国际化
import {IntlProvider} from 'react-intl';
import zhCNMessage from '@/lang/zh_CN';
import enCNMessage from '@/lang/en_US';
import {SmileOutlined} from '@ant-design/icons';
import {Fa} from '@fa/ui';
import {useLocalStorage} from 'react-use';
import {SITE_INFO} from '@/configs'

import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

function handleAntdMessages(lang: string) {
  dayjs.locale('zh-cn');
  switch (lang) {
    case 'zh_CN':
      return zhCN;
    case 'en_US':
      dayjs.locale('en');
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
  themeDark: boolean;
  setThemeDark: (dark: boolean) => void;
}

export const LangContext = createContext<LangContextProps>({
  locale: 'zh_CN',
  setLocale: () => {
    console.log('LangContext.setLocale');
  },
  setColorPrimary: () => {
    console.log('LangContext.setLocale');
  },
  themeDark: false,
  setThemeDark: () => {
    console.log('LangContext.setThemeDark');
  },
});

// 全局表单提示校验
const validateMessages = {
  // eslint-disable-next-line no-template-curly-in-string
  required: "'${label}' 是必选字段",
};

// 自定义Empty组件内容
const customizeRenderEmpty = () => (
  <div style={{textAlign: 'center'}}>
    <SmileOutlined style={{fontSize: 20}}/>
    <div>暂无数据</div>
  </div>
);

const ThemeConfig = {
  light: {
    'fa-bg-color': '#fff',
    'fa-bg-color-hover': '#99999999',
    'fa-bg-color2': '#eee',
    'fa-bg-grey': '#fafafa',
    'fa-text-color': '#353535',
    'fa-text-color2': '#353535',
    'fa-text-color-hover': '#353535',
    'fa-subtitle-color': '#666',
    'fa-border-color': '#eee',
    'separator-border': '#eee',
  },
  dark: {
    'fa-bg-color': '#05202F',
    'fa-bg-color-hover': '#99999999',
    'fa-bg-color2': '#012C4A',
    'fa-bg-grey': '#05202F',
    'fa-text-color': '#FFF',
    'fa-text-color2': '#eee',
    'fa-text-color-hover': '#FFF',
    'fa-subtitle-color': '#A5C9E6',
    'fa-border-color': '#0A3046',
    'separator-border': '#0A3046',
  },
}

/**
 * 国际化组件
 */
function LangLayout({children}: Fa.BaseChildProps) {
  const [locale, setLocale] = useState('zh_CN');
  const [colorPrimary, setColorPrimary] = useLocalStorage<string>('colorPrimary', SITE_INFO.PRIMARY_COLOR);
  const [themeDark, setThemeDark] = useLocalStorage<boolean>('themeDark', SITE_INFO.THEME === 'dark');

  useEffect(() => {
    const rootDom = document.getElementsByTagName('body')[0].style;
    rootDom.setProperty('--primary-color', colorPrimary!);

    changeTheme(themeDark);
  }, []);

  function changeTheme(dark: boolean|undefined) {
    const themeData:any = dark ? 'dark' : 'light';
    document.body.setAttribute('data-theme', themeData); // 设置tailwindcss主题

    const rootDom = document.getElementsByTagName('body')[0].style;

    console.log('themeData', themeData)
    each(ThemeConfig.light, (_v, k) => {
      // @ts-ignore
      rootDom.setProperty(`--${k}`, ThemeConfig[themeData][k]);
    })
  }

  return (
    <LangContext.Provider
      value={{
        locale,
        setLocale: (v) => setLocale(v),
        setColorPrimary,
        themeDark: themeDark || false,
        setThemeDark: (dark: boolean) => {
          setThemeDark(dark);
          changeTheme(dark);
        },
      }}
    >
      <ConfigProvider
        locale={handleAntdMessages(locale)}
        form={{validateMessages}}
        renderEmpty={customizeRenderEmpty}
        theme={{
          algorithm: themeDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            borderRadius: 3,
            colorPrimary: colorPrimary,
            colorBgContainer: themeDark ? '#05202F' : '#FFF',
          },
        }}
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
