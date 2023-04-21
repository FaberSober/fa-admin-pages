import React, {CSSProperties, useEffect, useRef, useState} from 'react';
import {AutoComplete} from "@uiw/react-amap";


export interface AMapAutoCompleteProps {
  onSelect?: (event: AMap.AutoCompleteEventsCallback) => void;
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
    console.log(mapRef.current)
    setInput(mapRef.current);
  }, []);

  console.log('input', input)

  return (
    <div style={{ position: 'relative', ...style}}>
      <input type="text" ref={mapRef}/>
      <div>
        {input && (
          <AutoComplete
            input={input}
            onSelect={(opts) => {
              if (onSelect) onSelect(opts)
            }}
          />
        )}
      </div>
    </div>
  )
}
