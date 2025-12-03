import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { ApiEffectLayout, PageLoading, ThemeLayout } from '@fa/ui';
import { SITE_INFO } from '@/configs';
import LangLayout from '../lang/LangLayout';
import ConfigLayout from '../config/ConfigLayout';
import UserLayout from '../user/UserLayout';
import MenuLayout from './MenuLayout';
import AMapLayout from '../amap/AMapLayout';
import WebSocketLayout from '../websocket/WebSocketLayout';
import { WebSocketProvider } from '../websocket';


interface MenuContainerProps {
  renderHeaderExtra?: () => React.ReactNode;
  extra?: () => React.ReactNode;
}

export default function MenuContainer({ renderHeaderExtra, extra }: MenuContainerProps) {
  return (
    <ThemeLayout colorPrimary={SITE_INFO.PRIMARY_COLOR} initThemeDark={SITE_INFO.THEME === 'dark'}>
      <LangLayout>
        <ApiEffectLayout>
          <ConfigLayout>
            <UserLayout>
              <WebSocketLayout>
                <WebSocketProvider>
                  <AMapLayout>
                    <MenuLayout renderHeaderExtra={renderHeaderExtra}>
                      <Suspense fallback={<PageLoading />}>
                        <Outlet />
                        {extra && extra()}
                      </Suspense>
                    </MenuLayout>
                  </AMapLayout>
                </WebSocketProvider>
              </WebSocketLayout>
            </UserLayout>
          </ConfigLayout>
        </ApiEffectLayout>
      </LangLayout>
    </ThemeLayout>
  );
}
