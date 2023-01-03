import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { ApiEffectLayout, MenuLayout, PageLoading } from '@fa/ui';
import LangLayout from '@fa-admin-pages/layout/lang/LangLayout';
import { LangToggle, HelpCube, UserAvatar } from './cube';
import { UserLayout } from "@fa-admin-pages/layout";


export default function MenuContainer() {
  return (
    <LangLayout>
      <ApiEffectLayout>
        <UserLayout>
          <MenuLayout
            rightDom={
              <>
                <LangToggle />
                <HelpCube />
                <UserAvatar />
              </>
            }
          >
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          </MenuLayout>
        </UserLayout>
      </ApiEffectLayout>
    </LangLayout>
  );
}
