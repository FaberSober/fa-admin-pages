import { FaIcon } from '@fa/icons';
import { Icon as OnlineIcon, type IconProps } from '@iconify/react';
import { Icon as OfflineIcon } from '@iconify/react/offline';
import React, { useContext } from 'react';
import ConfigLayoutContext from '../../layout/config/context/ConfigLayoutContext';

export interface FaIconProProps extends IconProps {
  icon: string;
}

/**
 * @author xu.pengfei
 * @date 2026-03-09 14:31:15
 */
export default function FaIconPro({ icon, ...props }: FaIconProProps) {
  const { systemConfig } = useContext(ConfigLayoutContext);
  if (icon.startsWith('mdi:')) {
    const Icon = systemConfig?.offline === false ? OnlineIcon : OfflineIcon;
    return <Icon icon={icon} fontSize='18px' className='' {...props} />
  }
  return (
    <FaIcon icon={icon} {...props} />
  );
}
