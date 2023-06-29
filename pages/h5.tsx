import React, {Suspense} from 'react';
import {LangLayout} from "@features/fa-admin-pages/layout";
import {Outlet} from "react-router-dom";
import {PageLoading} from "@fa/ui";


/**
 * @author xu.pengfei
 * @date 2023/6/28 15:52
 */
export default function h5() {
  return (
    <LangLayout>
      <Suspense fallback={<PageLoading />}>
        <Outlet />
      </Suspense>
    </LangLayout>
  )
}
