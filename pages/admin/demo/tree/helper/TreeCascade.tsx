import React from 'react';
import { BaseCascader, BaseCascaderProps } from '@fa/ui';
import { treeApi } from '@/services';
import { Demo } from '@/types';

export interface TreeCascadeProps extends Omit<BaseCascaderProps<Demo.Tree>, 'serviceApi'> {}

/**
 * @author xu.pengfei
 * @date 2020/12/25
 */
export default function TreeCascade(props: TreeCascadeProps) {
  return <BaseCascader showRoot serviceApi={treeApi} {...props} />;
}
