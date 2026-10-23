import { BookOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { BaseTree, Fa, FaEnums, FaFlexRestLayout, useApiLoading } from '@fa/ui';
import { dictApi } from '@features/fa-admin-pages/services';
import { Admin } from "@features/fa-admin-pages/types";
import { Button, Input, Splitter, Tag, Tooltip, Typography } from 'antd';
import { useState } from 'react';
import { dispatch } from 'use-bus';
import DictDataList from "./cube/DictDataList";
import DictDataOptions from "./cube/DictDataOptions";
import DictDataTree from "./cube/DictDataTree";
import DictOptionsEdit from './cube/DictOptionsEdit';
import './index.scss';
import DictModal from './modal/DictModal';


/**
 * 字典管理
 * @author xu.pengfei
 * @date 2020/12/25
 */
export default function DictManage() {
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

  const TYPE_TIPS = {
    [FaEnums.DictTypeEnum.LINK_OPTIONS]: '关联列表：dict表关联dict_data表，以列表形式存储',
    [FaEnums.DictTypeEnum.LINK_TREE]: '关联树：dict表关联dict_data表，以树形式存储',
    [FaEnums.DictTypeEnum.TEXT]: '字符串：dict表直接存储字典字符串',
    [FaEnums.DictTypeEnum.OPTIONS]: '选择列表：dict表直接存储列表项为json数组，不关联dict_data表',
  }

  const loading = useApiLoading([dictApi.getUrl('update')])
  return (
    <div className="fa-full-content-p12">
      <Splitter className="fa-islands-layout">
        {/* 左侧面板 */}
        <Splitter.Panel defaultSize={260} min={240} max="50%" collapsible>
          <aside className="fa-islands-sidebar" aria-label="字典分组导航">
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
          </aside>
        </Splitter.Panel>

        {/* 右侧面板 */}
        <Splitter.Panel>
          <div className="fa-flex-column fa-full fa-islands-main">
            {viewRecord ? (
              <div className="fa-flex-column fa-full fa-islands-content">
                <header className="fa-islands-toolbar">
                  <div className="fa-islands-heading">
                    <span className="fa-islands-heading-icon">
                      <BookOutlined />
                    </span>
                    <div className="fa-islands-heading-text">
                      <div className="fa-h3">{viewRecord.name}</div>
                      <Typography.Text type="secondary">
                        {viewRecord.code}{viewRecord.description && ` / ${viewRecord.description}`}
                      </Typography.Text>
                    </div>
                    <Tooltip title={TYPE_TIPS[viewRecord.type]}>
                      <Tag icon={<InfoCircleOutlined />}>{FaEnums.DictTypeEnumMap[viewRecord.type]}</Tag>
                    </Tooltip>
                  </div>
                </header>

                <section className="fa-islands-table fa-p12" aria-label="字典内容">
                  <FaFlexRestLayout className="fa-flex-column">
                    {viewRecord.type === FaEnums.DictTypeEnum.OPTIONS && <DictOptionsEdit dict={viewRecord} onChange={(v) => setViewRecord(v)} onRefresh={refreshData} />}
                    {viewRecord.type === FaEnums.DictTypeEnum.TEXT && (
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
                    {viewRecord.type === FaEnums.DictTypeEnum.LINK_OPTIONS && <DictDataOptions dictId={viewRecord.id} />}
                    {viewRecord.type === FaEnums.DictTypeEnum.LINK_TREE && <DictDataTree dictId={viewRecord.id} />}
                  </FaFlexRestLayout>
                </section>
              </div>
            ) : (
              <DictDataList />
            )}
          </div>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
}
