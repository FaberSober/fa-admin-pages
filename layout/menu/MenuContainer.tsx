import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { ApiEffectLayout, PageLoading, ThemeLayout } from '@fa/ui';
import LangLayout from "../lang/LangLayout";
import ConfigLayout from "../config/ConfigLayout";
import UserLayout from "../user/UserLayout";
import MenuLayout from "./MenuLayout";
import { SITE_INFO } from "@/configs";


import 'allotment/dist/style.css';
import { AMapLayout } from "@features/fa-admin-pages/layout";

export default function MenuContainer() {
  return (
    <ThemeLayout colorPrimary={SITE_INFO.PRIMARY_COLOR}>
      <LangLayout>
        <ApiEffectLayout>
          <ConfigLayout>
            <UserLayout>
              <AMapLayout>
                <MenuLayout>
                  <Suspense fallback={<PageLoading />}>
                    <Outlet />
                  </Suspense>
                </MenuLayout>
              </AMapLayout>
            </UserLayout>
          </ConfigLayout>
        </ApiEffectLayout>
      </LangLayout>
    </ThemeLayout>
  );
}
