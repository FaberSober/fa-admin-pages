import React, { useEffect, useState } from 'react';
import { Cascader } from "antd";
import { isNil, trim } from "lodash";
import routes from "~react-pages";
import { CascaderProps } from "antd/es/cascader";

function loop(rs:any[]):any[]|undefined {
  if (isNil(rs) || rs.length === 0) return undefined;

  return rs.filter(r => r.path !== '*' && r.path !== '' && r.path !== '/').map(r => {
    return {
      value: r.path,
      label: r.path,
      children: loop(r.children)
    }
  })
}
const routeTree = loop(routes)
// console.log('routeTree', routeTree)

export interface RouteCascaderProps extends Omit<CascaderProps<any>, 'value'|'onChange'> {
  value?: string;
  onChange?: (v:string) => void;
}

/**
 * @author xu.pengfei
 * @date 2023/1/4 14:48
 */
export default function RouteCascader({ value, onChange, ...props }: RouteCascaderProps) {
  const [innerValue, setInnerValue] = useState<any[]>(valueToInner(value))

  useEffect(() => {
    setInnerValue(valueToInner(value))
  }, [value])

  function valueToInner(v:any) {
    return trim(v).split("/").filter(i => i !== '');
  }

  function handleValueChange(v:any[]) {
    setInnerValue(v)
    if (onChange) {
      const path = "/" + (v || []).join("/")
      onChange(path);
    }
  }

  return (
    <Cascader options={routeTree} value={innerValue} onChange={handleValueChange} changeOnSelect {...props} />
  )
}
