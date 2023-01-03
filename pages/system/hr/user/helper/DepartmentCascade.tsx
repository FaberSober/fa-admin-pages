import React from 'react';
import { BaseCascader, BaseCascaderProps, departmentApi } from '@fa/ui';
import { Admin } from '@/types';

export interface DepartmentCascadeProps extends Omit<BaseCascaderProps<Admin.Department, string>, 'serviceApi'> {}

/**
 * @author xu.pengfei
 * @date 2020/12/25
 */
export default function DepartmentCascade(props: DepartmentCascadeProps) {
  return <BaseCascader showRoot={false} serviceApi={departmentApi} placeholder="请选择部门" {...props} />;
}
