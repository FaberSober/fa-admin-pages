import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { ApiEffectLayout, PageLoading } from '@fa/ui';
import { LangLayout, UserLayout } from "@fa-admin-pages/layout";
import MenuLayout from "./MenuLayout";


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
