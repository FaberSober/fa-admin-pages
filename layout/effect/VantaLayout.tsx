import React, {CSSProperties, ReactNode, useContext, useEffect, useRef} from 'react';
import { ConfigLayoutContext } from "@/layout";
import styles from "./VantaLayout.module.scss";
import {fileSaveApi} from "@fa/ui";


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

  const bgStyle:CSSProperties = {
    background: systemConfig.loginBg ? `url(${fileSaveApi.genLocalGetFile(systemConfig.loginBg)}) no-repeat` : '',
    backgroundSize: '100% 100%',
  }
  console.log(bgStyle)

  return (
    <div ref={vantaRef} className={styles['main-container']}>
      <div className="fa-full-content" style={bgStyle}>
        {/* left title info */}
        <div className={styles.bannerDiv}>
          <div>
            <div className={styles.bannerTitle} style={{color: systemConfig.titleColor}}>{systemConfig?.title || '-'}</div>
            <div className={styles.bannerSubTitle} style={{color: systemConfig.subTitleColor}}>{systemConfig?.subTitle || '-'}</div>
            <div style={{width: 1, height: 260}} />
          </div>
        </div>

        {/* right panel slot */}
        <div className={styles.mainDiv}>
          <div className={styles.main}>
            {children}
          </div>
        </div>

        {/* bottom copyright */}
        <div className={styles.footerDiv}>
          <div className={styles.footerMain} style={{color: systemConfig.copColor}}>
            {systemConfig?.cop}
          </div>
        </div>
      </div>
    </div>
  )
}
