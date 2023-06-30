import React, {Suspense} from 'react';
import {LangLayout} from "@features/fa-admin-pages/layout";
import {Outlet} from "react-router-dom";
import {PageLoading} from "@fa/ui";


/**
 * 公开访问页面
 * @author xu.pengfei
 * @date 2023/6/28 15:52
 */
export default function out() {
  return (
    <LangLayout>
      <Suspense fallback={<PageLoading />}>
        <Outlet />
      </Suspense>
    </LangLayout>
  )
}
