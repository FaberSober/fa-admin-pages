import React, {useEffect, useRef, useState} from 'react';
import {FaFlexRestLayout, FaHref, FaUtils} from "@fa/ui";
import MonacoEditor from "react-monaco-editor";
import {useSize, useUpdate} from "ahooks";
import { Generator } from "@features/fa-admin-pages/types";
import {Button, Form, Input, Modal, Space, Tree} from "antd";
import {CopyOutlined} from "@ant-design/icons";
import {useLocalStorage} from "react-use";
import {DataNode, DirectoryTreeProps} from "antd/es/tree";
import {camelCase, get, isNil, trim} from "lodash";
import {generatorApi} from "@features/fa-admin-pages/services";


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

  const [form] = Form.useForm();
  const update = useUpdate();
  const [codeGen, setCodeGen] = useState<Generator.CodeGenRetVo>()
  const [selItem, setSelItem] = useState<any>()
  const [configCache, setConfigCache] = useLocalStorage<any>('generator.configCache', {
    packageName: 'com.faber.api',
    tablePrefix: 'base_',
    mainModule: 'base',
    javaCopyPath: 'fa-base',
    rnCopyPath: 'frontend\\apps\\admin\\features\\fa-admin-pages\\pages\\admin',
    author: '',
    email: '',
  });

  const onSelect: DirectoryTreeProps['onSelect'] = (keys, info) => {
    if (keys.length !== 1) return;

    const item:any = info.selectedNodes[0];
    console.log('item', item)

    if (isNil(item.type)) return;
    setSelItem(item)
  }

  useEffect(() => {
    fetchPreview()
  }, [selItem])

  function fetchPreview() {
    if (selItem === undefined) return;
    const fieldsValue = form.getFieldsValue();
    setConfigCache(fieldsValue)
    generatorApi.preview({
      packageName: get(fieldsValue, 'packageName', ''),
      tablePrefix: get(fieldsValue, 'tablePrefix', ''),
      mainModule: get(fieldsValue, 'mainModule', ''),
      tableName: selItem.tableName,
      type: selItem.type,
      author: get(fieldsValue, 'author', ''),
      email: get(fieldsValue, 'email', ''),
    }).then(res => {
      setCodeGen(res.data)
    })
  }

  function handleCopyAll() {
    Modal.confirm({
      title: '????????????',
      content: '???????????????????????????',
      onOk: () => {
        const fieldsValue = form.getFieldsValue();
        const params = {
          packageName: get(fieldsValue, 'packageName', ''),
          tablePrefix: get(fieldsValue, 'tablePrefix', ''),
          mainModule: get(fieldsValue, 'mainModule', ''),
          tableNames,
          author: get(fieldsValue, 'author', ''),
          email: get(fieldsValue, 'email', ''),
          javaCopyPath: get(fieldsValue, 'javaCopyPath', ''),
          rnCopyPath: get(fieldsValue, 'rnCopyPath', ''),
        }
        generatorApi.copyAll(params).then(res => FaUtils.showResponse(res, '??????'))
      }
    })
  }

  function handleCopyOne() {
    if (selItem === undefined) return;

    Modal.confirm({
      title: '??????',
      content: '???????????????????????????',
      onOk: () => {
        const fieldsValue = form.getFieldsValue();
        const params = {
          packageName: get(fieldsValue, 'packageName', ''),
          tablePrefix: get(fieldsValue, 'tablePrefix', ''),
          mainModule: get(fieldsValue, 'mainModule', ''),
          tableName: selItem.tableName,
          type: selItem.type,
          author: get(fieldsValue, 'author', ''),
          email: get(fieldsValue, 'email', ''),
          javaCopyPath: get(fieldsValue, 'javaCopyPath', ''),
          rnCopyPath: get(fieldsValue, 'rnCopyPath', ''),
        }
        generatorApi.copyOne(params).then(res => FaUtils.showResponse(res, '??????'))
      }
    })
  }

  function tableNameToJava(tableName:string) {
    const name = tableNameToCaml(tableName);
    return name.substr(0, 1).toUpperCase() + name.substr(1)
  }

  function tableNameToCaml(tableName:string) {
    const tablePrefix = form.getFieldValue('tablePrefix');
    return camelCase(tableName.replace(trim(tablePrefix), ''))
  }

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
            title: `${tableNameToCaml(i)}.ts`,
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
            title: `${tableNameToCaml(i)}.ts`,
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
    <div className="fa-full-content-p12 fa-flex-row">
      <div className="fa-flex-column" style={{width: 550, marginRight: 12}}>
        <FaFlexRestLayout>
          <Tree.DirectoryTree
            defaultExpandAll
            onSelect={onSelect}
            treeData={treeData}
          />
        </FaFlexRestLayout>

        <Form
          form={form}
          initialValues={configCache}
          onFieldsChange={(cv:any) => {
            if (cv.tablePrefix) {
              update()
              fetchPreview()
            }
            setConfigCache(form.getFieldsValue())
          }}
        >
          <Form.Item name="packageName" label="??????" rules={[{ required: true }]}>
            <Input placeholder="base_table_name" />
          </Form.Item>
          <Form.Item name="tablePrefix" label="???????????????" rules={[{ required: false }]}>
            <Input placeholder="base_" />
          </Form.Item>
          <Form.Item name="mainModule" label="????????????" rules={[{ required: true }]}>
            <Input placeholder="base.admin" />
          </Form.Item>
          <Form.Item name="javaCopyPath" label="Java????????????" rules={[{ required: true }]}>
            <Input placeholder="????????????" />
          </Form.Item>
          <Form.Item name="rnCopyPath" label="??????????????????" rules={[{ required: true }]}>
            <Input placeholder="?????????????????????" />
          </Form.Item>
          <Form.Item name="author" label="??????" rules={[{ required: true }]}>
            <Input placeholder="??????" />
          </Form.Item>
          <Form.Item name="email" label="email" rules={[{ required: true }]}>
            <Input placeholder="email" />
          </Form.Item>
        </Form>
      </div>

      <FaFlexRestLayout style={{display: 'flex', flexDirection: 'column'}}>
        <Space className="fa-mb12">
          <FaHref onClick={() => {FaUtils.copyToClipboard(selItem?.title)}} icon={<CopyOutlined/>} text={selItem && selItem.title} />
          <Button onClick={handleCopyAll} icon={<CopyOutlined />}>??????????????????</Button>
          {selItem && <Button onClick={handleCopyOne} icon={<CopyOutlined />}>??????????????????</Button>}
        </Space>

        <FaFlexRestLayout>
          <div ref={domRef} style={{height: '100%'}}>
            {size && size.height && (
              <MonacoEditor
                height={size.height}
                theme="vs-dark"
                language={codeGen ? codeGen.type.split(".")[0] : ''}
                value={codeGen && codeGen.code}
                options={{
                  readOnly: true,
                  selectOnLineNumbers: true,
                  folding: true,
                  minimap: { enabled: true },
                }}
              />
            )}
          </div>
        </FaFlexRestLayout>
      </FaFlexRestLayout>
    </div>
  )
}
