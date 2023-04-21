import React, {CSSProperties, useEffect, useRef, useState} from 'react';
import {AutoComplete} from "@uiw/react-amap";
import {Fa} from "@fa/ui";
import {message} from "antd";


export interface AMapAutoCompleteProps {
  onSelect?: (lnglat: Fa.LngLat, address?: string) => void;
  style?: CSSProperties;
}

/**
 * @author xu.pengfei
 * @date 2023/4/21 14:29
 */
export default function AMapAutoComplete({onSelect, style}: AMapAutoCompleteProps) {
  const mapRef = useRef<any>();
  const [input, setInput] = useState();
  useEffect(() => {
    setInput(mapRef.current);
  }, []);

  return (
    <div style={{ position: 'relative', ...style}}>
      <input type="text" ref={mapRef} className="fa-input-amap-search" />
      <div>
        {input && (
          <AutoComplete
            input={input}
            onSelect={(opts: any) => {
              if (opts.poi.location == undefined) {
                message.error("该位置没有坐标信息，请选择其他位置")
                return
              }
              if (onSelect) {
                onSelect({ lng: opts.poi.location.lng!, lat: opts.poi.location.lat! }, opts.poi.name)
              }
            }}
          />
        )}
      </div>
    </div>
  )
}
