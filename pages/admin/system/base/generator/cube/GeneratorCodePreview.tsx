import React, { useRef, useState } from 'react';
import { FaFlexRestLayout } from "@fa/ui";
import MonacoEditor from "react-monaco-editor";
import { useSize } from "ahooks";
import CodeTree from './CodeTree'
import { Generator } from "@features/fa-admin-pages/types";


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

  const [codeGen, setCodeGen] = useState<Generator.CodeGenRetVo>()

  return (
    <div className="fa-full-content-p12 fa-flex-row">
      <div style={{width: 600, marginRight: 12}}>
        <CodeTree
          tableNames={tableNames}
          onCodeChange={setCodeGen}
        />
      </div>

      <FaFlexRestLayout>
        <div ref={domRef} style={{height: '100%'}}>
          {size && size.height && (
            <MonacoEditor
              height={size.height}
              theme="vs-dark"
              language={codeGen ? codeGen.type.split(".")[0] : ''}
              value={codeGen && codeGen.code}
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
