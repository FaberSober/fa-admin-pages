import React from 'react';
import { BaseCascader, BaseCascaderProps } from '@fa/ui';
import { Admin } from '@/types';
import { dictApi } from '@/services';

export interface DictCascadeProps extends Omit<BaseCascaderProps<Admin.Dict>, 'serviceApi'> {}

/**
 * @author xu.pengfei
 * @date 2020/12/25
 */
export default function DictCascade(props: DictCascadeProps) {
  return <BaseCascader showRoot serviceApi={dictApi} {...props} />;
}
