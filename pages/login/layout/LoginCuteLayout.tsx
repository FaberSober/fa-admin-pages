import React, { type CSSProperties, useContext, useEffect, useRef } from 'react';
import { trim } from 'lodash';
import { type Fa, fileSaveApi } from '@fa/ui';
import { DEFAULT_LOGIN_BACKGROUND_URL } from '@features/fa-admin-pages/constants/staticAssets';
import { ConfigLayoutContext } from '@features/fa-admin-pages/layout/config/context/ConfigLayoutContext';
import styles from './LoginCuteLayout.module.scss';

/**
 *
 * @author xu.pengfei
 * @date 2023/2/6 10:26
 */
export default function LoginCuteLayout({ children }: Fa.BaseChildProps) {
  const vantaRef = useRef<any>();
  const { systemConfig } = useContext(ConfigLayoutContext);

  useEffect(() => {
    if (systemConfig === undefined) return;
    // 表示有背景图片
    if (trim(systemConfig.loginBg) !== '') return;

    // 使用vanta制作背景效果图
    // const vantaEffect = window.VANTA.WAVES({
    //   el: vantaRef.current,
    //   // THREE: THREE, // use a custom THREE when initializing
    //   mouseControls: true,
    //   touchControls: true,
    //   gyroControls: false,
    //   minHeight: 200.0,
    //   minWidth: 200.0,
    //   scale: 1.0,
    //   scaleMobile: 1.0,
    //   zoom: 0.79,
    // });
    // return () => {
    //   if (vantaEffect) vantaEffect.destroy();
    // };
  }, [systemConfig]);

  const configuredBgUrl = trim(systemConfig.loginBg) ? fileSaveApi.genLocalGetFile(systemConfig.loginBg) : '';
  const bgStyle: CSSProperties = {
    backgroundImage: configuredBgUrl
      ? `url(${configuredBgUrl}), url(${DEFAULT_LOGIN_BACKGROUND_URL})`
      : `url(${DEFAULT_LOGIN_BACKGROUND_URL})`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: configuredBgUrl ? 'cover, cover' : 'cover',
  };
  // console.log(bgStyle)

  return (
    <div ref={vantaRef} className={styles['main-container']}>
      <div className="fa-full-content" style={bgStyle}>
        {/* right panel slot */}
        <div className={styles.mainDiv}>
          <div className={styles.main}>{children}</div>
        </div>
      </div>
    </div>
  );
}
