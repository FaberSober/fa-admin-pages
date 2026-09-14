import { ApiEffectLayout, ThemeLayout } from '@fa/ui';
import React from 'react';
import { SITE_INFO } from '@/configs';
import AMapLayout from '../amap/AMapLayout';
import ConfigLayout from '../config/ConfigLayout';
import LangLayout from '../lang/LangLayout';
import UserLayout from '../user/UserLayout';
import WebSocketLayout from '../websocket/WebSocketLayout';
import MenuLayout from './MenuLayout';

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
                <AMapLayout>
                  <MenuLayout renderHeaderExtra={renderHeaderExtra} renderContentExtra={extra} />
                </AMapLayout>
              </WebSocketLayout>
            </UserLayout>
          </ConfigLayout>
        </ApiEffectLayout>
      </LangLayout>
    </ThemeLayout>
  );
}
