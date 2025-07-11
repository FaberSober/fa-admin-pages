import React, { useContext, useState } from 'react';
import { Button, Input } from 'antd';
import { ApiEffectLayoutContext, BaseTree, Fa, FaFlexRestLayout, FaLabel } from '@fa/ui';
import { dictApi } from '@features/fa-admin-pages/services';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import DictModal from './modal/DictModal';
import DictOptionsEdit from './cube/DictOptionsEdit';
import { Admin, AdminEnums } from "@features/fa-admin-pages/types";
import { dispatch } from 'use-bus'
import DictDataOptions from "./cube/DictDataOptions";
import DictDataTree from "./cube/DictDataTree";
import DictDataList from "./cube/DictDataList";

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

  function handleUpdate() {
    if (viewRecord === undefined) return;
    dictApi.update(viewRecord.id, viewRecord).then(res => {
      dispatch({ type: Fa.Constant.TREE_REFRESH_BUS_KEY })
      setViewRecord(res.data)
    })
  }

  const breadcrumbs = []
  if (viewRecord) {
    breadcrumbs.push({ title: viewRecord.name })
    breadcrumbs.push({ title: viewRecord.code })
    if (viewRecord.description) {
      breadcrumbs.push({ title: viewRecord.description })
    }
  }

  const loading = loadingEffect[dictApi.getUrl('update')]
  return (
    <div className="fa-full-content-p12">
      <Allotment>
        {/* 左侧面板 */}
        <Allotment.Pane minSize={200} preferredSize={240} maxSize={400}>
          <div className="fa-full fa-relative">
            <div style={{ position: 'absolute', left: 0, top: 0, right: 6, bottom: 0 }}>
              <BaseTree
                // showRoot
                showOprBtn
                onSelect={onTreeSelect}
                onAfterDelItem={onAfterDelItem}
                // 自定义配置
                serviceName="字典分组"
                ServiceModal={DictModal}
                serviceApi={dictApi}
                onAfterEditItem={r => {
                  if (viewRecord && r.id === viewRecord.id) {
                    setViewRecord({ ...r })
                  }
                }}
              />
            </div>
          </div>
        </Allotment.Pane>

        {/* 右侧面板 */}
        <div className="fa-flex-column fa-full fa-absolute fa-bg-white" style={{ left: 6 }}>
          {viewRecord ? (
            <div className="fa-flex-column fa-full fa-p12">
              <FaLabel title={`${viewRecord?.name} / ${viewRecord?.code}${viewRecord?.description ? ` / ${viewRecord?.description}` : ''}`} className="fa-mb12" />

              <FaFlexRestLayout>
                {viewRecord.type === AdminEnums.DictTypeEnum.OPTIONS && <DictOptionsEdit dict={viewRecord} onChange={(v) => setViewRecord(v)} onRefresh={refreshData} />}
                {viewRecord.type === AdminEnums.DictTypeEnum.TEXT && (
                  <div>
                    <div className="fa-flex-row-center fa-mb12">
                      <div style={{width: 100}} className="fa-text-right">字典值：</div>
                      <Input style={{width: 300}} value={viewRecord.value} onChange={e => setViewRecord({...viewRecord, value: e.target.value})}/>
                    </div>
                    <div className="fa-flex-row-center">
                      <div style={{width: 100}}></div>
                      <Button type="primary" onClick={() => handleUpdate()} loading={loading}>提交</Button>
                    </div>
                  </div>
                )}
                {viewRecord.type === AdminEnums.DictTypeEnum.LINK_OPTIONS && <DictDataOptions dictId={viewRecord.id} />}
                {viewRecord.type === AdminEnums.DictTypeEnum.LINK_TREE && <DictDataTree dictId={viewRecord.id} />}
              </FaFlexRestLayout>
            </div>
          ) : (
            <DictDataList />
          )}
        </div>
      </Allotment>
    </div>
  );
}
