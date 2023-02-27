import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { ApiEffectLayout, PageLoading } from '@fa/ui';
import LangLayout from "@features/fa-admin-pages/layout/lang/LangLayout";
import UserLayout from "@features/fa-admin-pages/layout/user/UserLayout";
import MenuLayout from "./MenuLayout";

import 'allotment/dist/style.css';


export default function MenuContainer() {
  return (
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
  );
}
