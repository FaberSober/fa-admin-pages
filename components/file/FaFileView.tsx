import React, { useContext, useEffect, useState } from 'react';
import { ConfigLayoutContext } from "@features/fa-admin-pages/layout";
import { Admin } from "@features/fa-admin-pages/types";
import { FaCipher, PageLoading } from "@fa/ui";
import { fileSaveApi } from "@features/fa-admin-pages/services";
import { Empty } from "antd";


export interface FaFileViewProps {
  fileId: string
}

/**
 * @author xu.pengfei
 * @date 2024/9/11 21:26
 */
export default function FaFileView({ fileId }: FaFileViewProps) {
  const { systemConfig } = useContext(ConfigLayoutContext)

  const [data, setData] = useState<Admin.FileSave>()

  useEffect(() => {
    fileSaveApi.getById(fileId).then(res => {
      setData(res.data)
    })
  }, [])

  if (data === undefined) return <PageLoading />
  if (data === null) return <Empty description="文件未找到" />

  const originUrl = window.location.origin + fileSaveApi.genLocalGetFile(fileId); //要预览文件的访问地址
  const previewUrl = originUrl + '?fullfilename=' + data.originalFilename;
  const url = systemConfig.kkFileViewUrl + '/onlinePreview?url='+encodeURIComponent(FaCipher.encryptByBase64(previewUrl));
  return (
    <iframe src={url} className="fa-full" style={{border: 'none'}}/>
  )
}
