import { FaIcon } from '@fa/icons';
import { Icon } from '@iconify/react';
import React from 'react';

export interface FaIconProProps {
  icon: string;
}

/**
 * @author xu.pengfei
 * @date 2026-03-09 14:31:15
 */
export default function FaIconPro({ icon, ...props }: FaIconProProps) {
  if (icon.startsWith('mdi:')) {
    return <Icon icon={icon} fontSize='18px' {...props} />
  }
  return (
    <FaIcon icon={icon} {...props} />
  );
}