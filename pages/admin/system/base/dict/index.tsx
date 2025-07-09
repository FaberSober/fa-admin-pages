import React, { useContext, useState } from 'react';
import { Empty, Segmented } from 'antd';
import { ApiEffectLayoutContext, BaseTree, Fa, FaLabel } from '@fa/ui';
import { dictApi } from '@features/fa-admin-pages/services';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import DictModal from './modal/DictModal';
import DictOptionsEdit from './cube/DictOptionsEdit';
import { DatabaseOutlined, OrderedListOutlined, SafetyCertificateOutlined, SettingOutlined } from "@ant-design/icons";
import { Admin, AdminEnums } from "@features/fa-admin-pages/types";
import { dispatch } from 'use-bus'
import { FaLoading } from "@features/fa-admin-pages/components";

/**
 * 字典管理
 * @author xu.pengfei
 * @date 2020/12/25
 */
export default function DictManage() {
  const {loadingEffect} = useContext(ApiEffectLayoutContext)
  const [viewRecord, setViewRecord] = useState<Admin.Dict>();

  function onTreeSelect(keys: any[]) {
    if (keys.length > 0) {
      dictApi.getById(keys[0]).then((res) => setViewRecord(res.data));
    } else {
      setViewRecord(undefined);
    }
  }

  function onAfterDelItem() {
    setViewRecord(undefined);
  }

  function refreshData() {
    if (viewRecord === undefined) return;
    dictApi.getById(viewRecord.id).then((res) => setViewRecord(res.data));
  }

  function handleChangeDictType(r: Admin.Dict, v: AdminEnums.DictTypeEnum) {
    dictApi.update(r.id, { ...r, type: v }).then(res => {
      dispatch({ type: Fa.Constant.TREE_REFRESH_BUS_KEY })
      setViewRecord(res.data)
    })
  }

  const loading = loadingEffect[dictApi.getUrl('update')]
  return (
    <div className="fa-full-content">
      <Allotment defaultSizes={[100, 500]}>
        {/* 左侧面板 */}
        <Allotment.Pane minSize={200} maxSize={400}>
          <BaseTree
            // showRoot
            showOprBtn
            onSelect={onTreeSelect}
            onAfterDelItem={onAfterDelItem}
            // 自定义配置
            serviceName="字典分组"
            ServiceModal={DictModal}
            serviceApi={dictApi}
          />
        </Allotment.Pane>

        {/* 右侧面板 */}
        <div className="fa-flex-column fa-full fa-p12">
          {viewRecord ? (
            <div className="fa-flex-column fa-full">
              <FaLabel title={`${viewRecord?.name} / ${viewRecord?.code} / ${viewRecord?.description || ''}`} className="fa-mb12" />

              <div className="fa-flex-row-center">
                <Segmented
                  value={viewRecord.type}
                  onChange={(v: any) => handleChangeDictType(viewRecord, v)}
                  options={[
                    {
                      label: '选择列表',
                      value: AdminEnums.DictTypeEnum.OPTIONS,
                      icon: <SettingOutlined />,
                    },
                    {
                      label: '字符串',
                      value: AdminEnums.DictTypeEnum.TEXT,
                      icon: <SafetyCertificateOutlined />,
                    },
                    {
                      label: '关联列表',
                      value: AdminEnums.DictTypeEnum.LINK_OPTIONS,
                      icon: <DatabaseOutlined />,
                    },
                    {
                      label: '关联树',
                      value: AdminEnums.DictTypeEnum.LINK_TREE,
                      icon: <OrderedListOutlined />,
                    },
                  ]}
                />

                <FaLoading loading={loading} text="修改中..." className="fa-ml8" />
              </div>

              <DictOptionsEdit dict={viewRecord} onChange={(v) => setViewRecord(v)} onRefresh={refreshData} />
            </div>
          ) : (
            <Empty description="请先选择字典分组" />
          )}
        </div>
      </Allotment>
    </div>
  );
}
