import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { ApiEffectLayout, PageLoading } from '@fa/ui';
import { LangLayout, UserLayout } from "@/layout";
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
