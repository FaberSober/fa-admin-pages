import React, { ReactNode, useContext, useEffect, useRef } from 'react';
import { ConfigLayoutContext } from "@/layout";
import styles from "./VantaLayout.module.scss";


export interface VantaLayoutProps {
  children?: ReactNode;
}

/**
 * @author xu.pengfei
 * @date 2023/2/6 10:26
 */
export default function VantaLayout({children}: VantaLayoutProps) {
  const vantaRef = useRef<any>();
  const { systemConfig } = useContext(ConfigLayoutContext);


  useEffect(() => {
    // 使用vanta制作背景效果图
    const vantaEffect = window.VANTA.WAVES({
      el: vantaRef.current,
      // THREE: THREE, // use a custom THREE when initializing
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
      zoom: 0.79,
    });
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, []);

  return (
    <div ref={vantaRef} className={styles['main-container']}>
      <div className={styles.bannerDiv}>
        <div>
          <div className={styles.bannerTitle}>{systemConfig?.title || '-'}</div>
          <div className={styles.bannerSubTitle}>{systemConfig?.subTitle || '-'}</div>
        </div>
      </div>

      <div className={styles.mainDiv}>
        <div className={styles.main}>
          {children}
        </div>
      </div>
    </div>
  )
}
