import React, { useState } from 'react';
import { DataNode, DirectoryTreeProps } from "antd/es/tree";
import { Input, Tree } from "antd";
import { FaFlexRestLayout } from "@fa/ui";
import { camelCase, isNil } from "lodash";


function tableNameToJava(tableName:string) {
  const name = camelCase(tableName);
  return name.substr(0, 1).toUpperCase() + name.substr(1)
}

export interface CodeTreeProps {
  tableNames: string[]
  onCodeChange: (code:string, language:string) => void;
}

/**
 * @author xu.pengfei
 * @date 2023/3/9 14:15
 */
export default function CodeTree({tableNames, onCodeChange}: CodeTreeProps) {
  const [packageName, setPackageName] = useState<string>("com.faber.api.xxx")

  const treeData: DataNode[] = [
    {
      title: 'main',
      key: 'main',
      children: [
        {
          title: 'java',
          key: 'java',
          children: [
            {
              title: 'entity',
              key: 'entity',
              children: tableNames.map(i => ({
                title: `${tableNameToJava(i)}.java`,
                key: i,
                isLeaf: true,
                type: 'java.entity',
              }))
            },
            {
              title: 'mapper',
              key: 'mapper',
            },
            {
              title: 'biz',
              key: 'biz',
            },
            {
              title: 'rest',
              key: 'rest',
            },
          ]
        },
        {
          title: 'mapperxml',
          key: 'mapperxml',
          isLeaf: true
        },
      ],
    },
    {
      title: 'frontend',
      key: '0-1',
      children: [
        { title: 'leaf 1-0', key: '0-1-0', isLeaf: true },
        { title: 'leaf 1-1', key: '0-1-1', isLeaf: true },
      ],
    },
  ];

  const onSelect: DirectoryTreeProps['onSelect'] = (keys, info) => {
    if (keys.length !== 1) return;

    const item:any = info.selectedNodes[0];
    console.log('item', item)

    if (isNil(item.type)) return;

    onCodeChange(item.title, 'java')
  };

  return (
    <div className="fa-full fa-flex-column">
      <FaFlexRestLayout>
        <Tree.DirectoryTree
          defaultExpandAll
          onSelect={onSelect}
          treeData={treeData}
        />
      </FaFlexRestLayout>

      <div>
        <div>包名：</div>
        <Input value={packageName} onChange={e => setPackageName(e.target.value)} />
      </div>
    </div>
  )
}