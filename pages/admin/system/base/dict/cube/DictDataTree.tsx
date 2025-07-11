import React, { useContext, useEffect, useState } from 'react';
import { Button, Space } from 'antd';
import { EditOutlined, PlusOutlined, SisternodeOutlined } from '@ant-design/icons';
import { useCounter } from 'react-use';
import { ApiEffectLayoutContext, AuthDelBtn, BaseTree, type Fa, FaFlexRestLayout, FaHref, useDelete } from '@fa/ui';
import { dictDataApi } from '@features/fa-admin-pages/services';
import { Admin } from "@features/fa-admin-pages/types";
import DictDataModal from '../modal/DictDataModal';


interface DictDataTreeProps {
  dictId: number;
}

export default function DictDataTree({ dictId }: DictDataTreeProps) {
  const { loadingEffect } = useContext(ApiEffectLayoutContext);
  const [edit, setEdit] = useState<Fa.TreeNode<Admin.DictData, number>>();
  const [open, setOpen] = useState(false);
  const [current, { inc }] = useCounter(0);

  useEffect(() => {
    refreshData();
  }, []);

  function refreshData() {
    setOpen(false);
    inc();
  }

  const [handleDelete] = useDelete<number>(dictDataApi.remove, refreshData, '菜单');

  function showEditModal(item: Fa.TreeNode<Admin.DictData, number>) {
    setEdit(item);
    setOpen(true);
  }

  const loadingTree = loadingEffect[dictDataApi.getUrl('allTree')];
  return (
    <div className="fa-full-content fa-flex-column fa-menu-div">
      <Space className="fa-mb12">
        <Button onClick={refreshData} loading={loadingTree}>
          刷新
        </Button>
        <DictDataModal title="新增字典" dictId={dictId} type="tree" fetchFinish={refreshData}>
          <Button type="primary" icon={<PlusOutlined/>} loading={loadingTree}>
            新增字典
          </Button>
        </DictDataModal>
        <Button>导出</Button>
        <Button>导入</Button>
      </Space>

      <div className="fa-flex-row-center fa-bg-grey">
        <div className="fa-dict-data-title fa-border-b fa-border-r" style={{flex: 1}}>
          字典名称
        </div>
        <div className="fa-dict-data-title fa-border-b fa-border-r" style={{flex: 1}}>
          字典值
        </div>
        <div className="fa-dict-data-title fa-border-b fa-border-r" style={{width: 100}}>
          是否默认
        </div>
        <div className="fa-dict-data-title fa-border-b fa-border-r" style={{flex: 1}}>
          描述
        </div>
        <div className="fa-dict-data-title fa-border-b " style={{width: 220}}>
          操作
        </div>
      </div>

      <FaFlexRestLayout>
        <BaseTree
          // showRoot
          showOprBtn
          // onSelect={(keys) => console.log('onSelect', keys)}
          onAfterDelItem={() => {
          }}
          // 自定义配置
          serviceName="Tree"
          serviceApi={{
            ...dictDataApi,
            allTree: () => dictDataApi.getTree({query: {dictId}}),
          }}
          bodyStyle={{width: '100%', height: '100%'}}
          showTips={false}
          showTopBtn={false}
          // @ts-ignore
          titleRender={(item: Fa.TreeNode<Admin.DictData, number> & { updating: boolean }) => (
            <div className="fa-menu-item">
              <div style={{flex: 1}}>{item.sourceData.label}</div>
              <div style={{flex: 1}}>
                {item.sourceData.value}
              </div>
              <div className="fa-plr12" style={{width: 100}}>
              </div>
              <div className="fa-plr12" style={{flex: 1}}>
                {item.sourceData.description}
              </div>
              <Space>
                <DictDataModal title="新增菜单" dictId={item.sourceData.dictId} type="tree" parentId={item.sourceData.id} fetchFinish={refreshData}>
                  <FaHref icon={<SisternodeOutlined/>} text="新增子节点"/>
                </DictDataModal>
                <FaHref icon={<EditOutlined/>} text="编辑" onClick={() => showEditModal(item)}/>
                <AuthDelBtn handleDelete={() => handleDelete(item.id)}/>
              </Space>
            </div>
          )}
          showLine={false}
          draggable
          extraEffectArgs={[current]}
        />
      </FaFlexRestLayout>

      <DictDataModal
        dictId={dictId}
        type="tree"
        title="编辑菜单"
        record={edit?.sourceData}
        fetchFinish={refreshData}
        open={open}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
