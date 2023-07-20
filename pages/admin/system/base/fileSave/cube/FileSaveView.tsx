import React from 'react';
import { Admin } from '@/types';
import { Descriptions } from "antd";
import { FaUtils } from "@fa/ui";


export interface FileSaveViewProps {
  file: Admin.FileSave;
}

/**
 * @author xu.pengfei
 * @date 2023/7/20 15:28
 */
export default function FileSaveView({ file }: FileSaveViewProps) {
  return (
    <div>
      <Descriptions column={1} bordered>
        <Descriptions.Item label="ID">{file.id}</Descriptions.Item>
        <Descriptions.Item label="文件访问地址">{file.url}</Descriptions.Item>
        <Descriptions.Item label="文件大小">{FaUtils.sizeToHuman(file.size)}</Descriptions.Item>
        <Descriptions.Item label="文件名">{file.filename}</Descriptions.Item>
        <Descriptions.Item label="基础存储路径">{file.basePath}</Descriptions.Item>
        <Descriptions.Item label="存储路径">{file.path}</Descriptions.Item>
        <Descriptions.Item label="扩展名">{file.ext}</Descriptions.Item>
      </Descriptions>
    </div>
  )
}