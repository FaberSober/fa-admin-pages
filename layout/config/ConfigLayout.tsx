import React, { useEffect, useState } from 'react';
import type { Admin } from '@/types';
// import Favicon from 'react-favicon'
import { Favicon } from '@features/fa-admin-pages/components/icons/Favicon';
import { type Fa, PageLoading } from '@fa/ui';
import { Alert } from 'antd';
import { configSysApi, fileSaveApi } from '@features/fa-admin-pages/services';
import { loadMdiIcons } from '@features/fa-admin-pages/components/icons/mdi';
import ConfigLayoutContext, { type ConfigLayoutContextProps } from './context/ConfigLayoutContext';

/**
 * 系统配置的上下文
 * @author xu.pengfei
 * @date 2022/9/21
 */
export default function ConfigLayout({ children }: Fa.BaseChildProps) {
  const [systemConfig, setSystemConfig] = useState<Admin.SystemConfigPo>();
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    refreshSystemConfig();
  }, []);

  // 获取系统配置参数
  async function refreshSystemConfig() {
    setLoadError(false);
    try {
      const res = await configSysApi.getSystemConfig();
      if (res.data.offline) await loadMdiIcons();
      setSystemConfig(res.data);
    } catch (error) {
      console.error('系统配置或本地图标加载失败', error);
      setLoadError(true);
    }
  }

  if (loadError) return <Alert type="error" message="系统资源加载失败，请刷新页面重试" />;
  if (systemConfig === undefined) return <PageLoading />;

  const contextValue: ConfigLayoutContextProps = {
    systemConfig,
    refreshSystemConfig,
  };

  return (
    <ConfigLayoutContext.Provider value={contextValue}>
      {systemConfig && systemConfig.logo && <Favicon url={fileSaveApi.genLocalGetFilePreview(systemConfig.logo)} />}
      {children}
    </ConfigLayoutContext.Provider>
  );
}
