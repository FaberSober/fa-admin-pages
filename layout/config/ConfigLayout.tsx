import React, { createContext, useEffect, useState } from 'react';
import { Admin } from '@/types';
import Favicon from 'react-favicon'
import { Fa, PageLoading } from "@fa/ui";
import { configSysApi, fileSaveApi } from '@/services';


export interface ConfigLayoutContextProps {
  systemConfig: Admin.SystemConfigPo;
}

export const ConfigLayoutContext = createContext<ConfigLayoutContextProps>({} as any);

/**
 * 系统配置的上下文
 * @author xu.pengfei
 * @date 2022/9/21
 */
export default function ConfigLayout({ children }: Fa.BaseChildProps) {
  const [systemConfig, setSystemConfig] = useState<Admin.SystemConfigPo>();

  useEffect(() => {
    // 获取系统配置参数
    configSysApi.getSystemConfig().then((res) => setSystemConfig(res.data));
  }, []);

  if (systemConfig === undefined) return <PageLoading />;

  const contextValue: ConfigLayoutContextProps = {
    systemConfig,
  };

  return (
    <ConfigLayoutContext.Provider value={contextValue}>
      {systemConfig && systemConfig.logo && <Favicon url={fileSaveApi.genLocalGetFilePreview(systemConfig.logo)} />}
      {children}
    </ConfigLayoutContext.Provider>
  );
}
