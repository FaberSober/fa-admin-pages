import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { ApiEffectLayout, PageLoading, ThemeLayout } from '@fa/ui';
import LangLayout from "../lang/LangLayout";
import UserLayout from "../user/UserLayout";
import MenuLayout from "./MenuLayout";
import {SITE_INFO} from "@/configs";


import 'allotment/dist/style.css';

export default function MenuContainer() {
  return (
    <ThemeLayout colorPrimary={SITE_INFO.PRIMARY_COLOR}>
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
    </ThemeLayout>
  );
}
