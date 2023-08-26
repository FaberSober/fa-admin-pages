import React from 'react';
import { Fa } from "@fa/ui";
import { APILoader } from '@uiw/react-amap';

const VITE_APP_AMAP_KEY = import.meta.env.VITE_APP_AMAP_KEY;


/**
 * @author xu.pengfei
 * @date 2023/8/26 12:08
 */
export default function AMapLayout({ children }: Fa.BaseChildProps) {
  return (
    <APILoader version="2.0.5" akey={VITE_APP_AMAP_KEY}>
      {children}
    </APILoader>
  )
}
