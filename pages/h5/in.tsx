import React, { Suspense } from 'react';
import { PageLoading } from "@fa/ui";
import { Outlet } from "react-router-dom";
import UserLayout from "../../layout/user/UserLayout";


/**
 * h5 登录后的用户界面
 * @author xu.pengfei
 * @date 2023/9/5 19:33
 */
export default function index() {
  return (
    <UserLayout>
      <Suspense fallback={<PageLoading/>}>
        <Outlet/>
      </Suspense>
    </UserLayout>
  )
}