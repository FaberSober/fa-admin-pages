import React, { useState } from 'react';
import { DataNode, DirectoryTreeProps } from "antd/es/tree";
import { Button, Form, Input, Space, Tree } from "antd";
import { FaFlexRestLayout } from "@fa/ui";
import { camelCase, get, isNil } from "lodash";
import { Generator } from "@/types";
import { generatorApi } from "@/services";
import { useLocalStorage } from "react-use";
import { CopyOutlined } from "@ant-design/icons";


function tableNameToJava(tableName:string) {
  const name = camelCase(tableName);
  return name.substr(0, 1).toUpperCase() + name.substr(1)
}

export interface CodeTreeProps {
  tableNames: string[]
  onCodeChange: (v:Generator.CodeGenRetVo) => void;
}

/**
 * @author xu.pengfei
 * @date 2023/3/9 14:15
 */
export default function CodeTree({tableNames, onCodeChange}: CodeTreeProps) {
  const [form] = Form.useForm();
  const [_codeGen, setCodeGen] = useState<Generator.CodeGenRetVo>()
  const [configCache, setConfigCache] = useLocalStorage<any>('generator.configCache', {
    packageName: 'com.faber.api',
    tablePrefix: 'base_',
    mainModule: 'base',
    javaCopyPath: 'fa-base/src/main/java/com/faber/api/base',
  });

  const onSelect: DirectoryTreeProps['onSelect'] = (keys, info) => {
    if (keys.length !== 1) return;

    const item:any = info.selectedNodes[0];
    console.log('item', item)

    if (isNil(item.type)) return;

    const fieldsValue = form.getFieldsValue();
    setConfigCache(fieldsValue)
    generatorApi.preview({
      packageName: get(fieldsValue, 'packageName', ''),
      tablePrefix: get(fieldsValue, 'tablePrefix', ''),
      mainModule: get(fieldsValue, 'mainModule', ''),
      tableName: item.tableName,
      type: item.type,
    }).then(res => {
      setCodeGen(res.data)
      onCodeChange(res.data)
    })
  };

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
                key: `${tableNameToJava(i)}.java`,
                isLeaf: true,
                type: 'java.entity',
                tableName: i,
              })),
            },
            {
              title: 'mapper',
              key: 'mapper',
              children: tableNames.map(i => ({
                title: `${tableNameToJava(i)}Mapper.java`,
                key: `${tableNameToJava(i)}Mapper.java`,
                isLeaf: true,
                type: 'java.mapper',
                tableName: i,
              })),
            },
            {
              title: 'biz',
              key: 'biz',
              children: tableNames.map(i => ({
                title: `${tableNameToJava(i)}Biz.java`,
                key: `${tableNameToJava(i)}Biz.java`,
                isLeaf: true,
                type: 'java.biz',
                tableName: i,
              })),
            },
            {
              title: 'rest',
              key: 'rest',
              children: tableNames.map(i => ({
                title: `${tableNameToJava(i)}Controller.java`,
                key: `${tableNameToJava(i)}Controller.java`,
                isLeaf: true,
                type: 'java.controller',
                tableName: i,
              })),
            },
          ]
        },
        {
          title: 'mapperxml',
          key: 'mapperxml',
          children: tableNames.map(i => ({
            title: `${tableNameToJava(i)}Mapper.xml`,
            key: `${tableNameToJava(i)}Mapper.xml`,
            isLeaf: true,
            type: 'xml.mapper',
            tableName: i,
          })),
        },
      ],
    },
    {
      title: 'frontend',
      key: '0-1',
      children: [
        {
          title: 'props',
          key: 'props',
          children: tableNames.map(i => ({
            title: `${camelCase(i)}.ts`,
            key: `${i}.rn.props`,
            isLeaf: true,
            type: 'rn.props',
            tableName: i,
          })),
        },
        {
          title: 'services',
          key: 'service',
          children: tableNames.map(i => ({
            title: `${camelCase(i)}.ts`,
            key: `${i}.rn.service`,
            isLeaf: true,
            type: 'rn.service',
            tableName: i,
          })),
        },
        {
          title: 'list',
          key: 'list',
          children: [
            {
              title: 'modal',
              key: 'modal',
              children: tableNames.map(i => ({
                title: `${tableNameToJava(i)}Modal.tsx`,
                key: `${i}.rn.modal`,
                isLeaf: true,
                type: 'rn.modal',
                tableName: i,
              })),
            },
            ...tableNames.map(i => ({
              title: `${tableNameToJava(i)}List.tsx`,
              key: `${i}.rn.list`,
              isLeaf: true,
              type: 'rn.list',
              tableName: i,
            })),
          ]
        },
      ],
    },
  ];

  return (
    <div className="fa-full fa-flex-column">
      <FaFlexRestLayout>
        <Tree.DirectoryTree
          defaultExpandAll
          onSelect={onSelect}
          treeData={treeData}
        />
      </FaFlexRestLayout>

      <Form form={form} initialValues={configCache}>
        <Form.Item name="packageName" label="包名" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="tablePrefix" label="去除表前缀" rules={[{ required: false }]}>
          <Input />
        </Form.Item>
        <Form.Item name="mainModule" label="前端模块" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="javaCopyPath" label="Java复制目录" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Space>
          <Button icon={<CopyOutlined />}>复制java文件到项目中</Button>
        </Space>
      </Form>
    </div>
  )
}