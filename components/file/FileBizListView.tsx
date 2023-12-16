import React from 'react';
import { Admin } from "@features/fa-admin-pages/types";
import { PaperClipOutlined } from "@ant-design/icons";
import { fileSaveApi } from "@features/fa-admin-pages/services";


export interface FileBizListViewProps {
  fileBizList: Admin.FileBiz[];
}

/**
 * {Admin.FileBiz}附件展示列表
 * @author xu.pengfei
 * @date 2023/12/16 09:58
 */
export default function FileBizListView({ fileBizList = [] }: FileBizListViewProps) {
  return (
    <div className="fa-flex-column">
      {fileBizList.map(item => {
        return (
          <a
            key={item.id}
            href={fileSaveApi.genLocalGetFile(item.fileId)}
          >
            <PaperClipOutlined />
            <span>{item.fileName}</span>
          </a>
        )
      })}
    </div>
  )
}
