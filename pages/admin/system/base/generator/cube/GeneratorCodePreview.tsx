import React, { useRef, useState } from 'react';
import { FaFlexRestLayout } from "@fa/ui";
import MonacoEditor from "react-monaco-editor";
import { useSize } from "ahooks";
import CodeTree from './CodeTree'


export interface GeneratorCodePreviewProps {
  tableNames: string[]
}

/**
 * @author xu.pengfei
 * @date 2023/3/9 13:59
 */
export default function GeneratorCodePreview({tableNames}: GeneratorCodePreviewProps) {
  const domRef = useRef<any | null>();
  const size = useSize(domRef);

  const [code, setCode] = useState<string>("")
  const [language, setLanguage] = useState<string>("java")

  return (
    <div className="fa-full-content-p12 fa-flex-row">
      <div style={{width: 600, marginRight: 12}}>
        <CodeTree
          tableNames={tableNames}
          onCodeChange={(c,l) => {
            setCode(c)
            setLanguage(l)
          }}
        />
      </div>

      <FaFlexRestLayout>
        <div ref={domRef} style={{height: '100%'}}>
          {size && size.height && (
            <MonacoEditor
              height={size.height}
              theme="vs-dark"
              language={language}
              value={code}
              options={{
                selectOnLineNumbers: true,
                folding: true,
                minimap: { enabled: true },
              }}
            />
          )}
        </div>
      </FaFlexRestLayout>
    </div>
  )
}
