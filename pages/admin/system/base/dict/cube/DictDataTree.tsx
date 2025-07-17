import React, { useContext, useEffect } from 'react';
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
  const [current, { inc }] = useCounter(0);

  useEffect(() => {
    refreshData();
  }, []);

  function refreshData() {
    inc();
  }

  const [handleDelete] = useDelete<number>(dictDataApi.remove, refreshData, '菜单');

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
        <div className="fa-dict-data-title fa-border-b fa-border-r" style={{width: 200}}>
          字典值
        </div>
        <div className="fa-dict-data-title fa-border-b fa-border-r fa-text-center" style={{width: 80}}>
          是否默认
        </div>
        <div className="fa-dict-data-title fa-border-b fa-border-r" style={{width: 200}}>
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
            <div className="fa-menu-item" style={{marginRight: -8}}>
              <div style={{flex: 1}}>{item.sourceData.label}</div>
              <div style={{width: 200}}>
                {item.sourceData.value}
              </div>
              <div className="fa-dict-data-title" style={{width: 80}}>
                {item.sourceData.isDefault && <div className="fa-text-center">✅</div>}
              </div>
              <div className="fa-dict-data-title" style={{width: 200}}>
                {item.sourceData.description}
              </div>
              <Space style={{width: 220}}>
                <DictDataModal title="新增菜单" dictId={item.sourceData.dictId} type="tree" parentId={item.sourceData.id} fetchFinish={refreshData}>
                  <FaHref icon={<SisternodeOutlined/>} text="新增子节点"/>
                </DictDataModal>
                <DictDataModal
                  dictId={dictId}
                  type="tree"
                  title="编辑菜单"
                  record={item.sourceData}
                  fetchFinish={refreshData}
                >
                  <FaHref icon={<EditOutlined/>} text="编辑"/>
                </DictDataModal>
                <AuthDelBtn handleDelete={() => handleDelete(item.id)}/>
              </Space>
            </div>
          )}
          showLine={false}
          draggable
          extraEffectArgs={[current]}
        />
      </FaFlexRestLayout>
    </div>
  );
}
