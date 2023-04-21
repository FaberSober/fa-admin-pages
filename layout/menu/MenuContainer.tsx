import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { ApiEffectLayout, PageLoading } from '@fa/ui';
import LangLayout from "../lang/LangLayout";
import UserLayout from "../user/UserLayout";
import MenuLayout from "./MenuLayout";
import { APILoader } from '@uiw/react-amap';

import 'allotment/dist/style.css';

const VITE_APP_AMAP_KEY = import.meta.env.VITE_APP_AMAP_KEY;

export default function MenuContainer() {
  return (
    // @ts-ignore
    <APILoader version="2.0.5" akey={VITE_APP_AMAP_KEY}>
      <LangLayout>
        <ApiEffectLayout>
          <UserLayout>
            <MenuLayout>
              <Suspense fallback={<PageLoading />}>
                <Outlet />
              </Suspense>
            </MenuLayout>
          </UserLayout>
        </ApiEffectLayout>
      </LangLayout>
    </APILoader>
  );
}
