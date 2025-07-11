import React, { useEffect, useState } from 'react';
import { Admin } from "@features/fa-admin-pages/types";
import { dictDataApi } from "@features/fa-admin-pages/services";
import { Fa, FaFlexRestLayout, FaSortList, FaUtils } from "@fa/ui";
import DictDataForm from "./DictDataForm";


export interface DictDataOptionsProps {
  dictId: number;
}

/**
 * @author xu.pengfei
 * @date 2025/7/11 14:49
 */
export default function DictDataOptions({ dictId }: DictDataOptionsProps) {
  const [array, setArray] = useState<Admin.DictData[]>([])

  useEffect(() => {
    fetchData()
  }, [dictId])

  function fetchData() {
    dictDataApi.list({ query: {dictId}, sorter: 'sort_id ASC' }).then((res) => {
      setArray(res.data);
    });
  }

  function handleChangeList(list: Admin.DictData[]) {
    console.log('change', list)
    setArray(list)
    const changeList: Fa.TreePosChangeVo[] = []
    list.forEach((item, index) => {
      if (item.sortId !== index) {
        changeList.push({ key: item.id, pid: item.parentId, index })
      }
    })
    dictDataApi.changePos(changeList)
  }

  function handleAdd(v: Admin.DictData) {
    dictDataApi.save({...v, dictId}).then((res) => {
      FaUtils.showResponse(res, '新增字典');
      fetchData()
    });
  }

  function handleEdit(v: Admin.DictData) {
    console.log('edit', v)
    dictDataApi.update(v.id, v).then((res) => {
      FaUtils.showResponse(res, '更新字典');
      fetchData()
    });
  }

  function handleDel(v: Admin.DictData) {
    dictDataApi.remove(v.id).then((res) => {
      FaUtils.showResponse(res, '删除字典');
      fetchData()
    });
  }

  return (
    <FaFlexRestLayout className="fa-bg-white">
      <div className="fa-flex-row-center fa-bg-grey">
        <div className="fa-p12 fa-border-b fa-border-r" style={{ flex: 1 }}>
          字典名称
        </div>
        <div className="fa-p12 fa-border-b fa-border-r" style={{ flex: 1 }}>
          字典值
        </div>
        <div className="fa-p12 fa-border-b fa-border-r" style={{ width: 100 }}>
          是否默认
        </div>
        <div className="fa-p12 fa-border-b fa-border-r" style={{ flex: 1 }}>
          描述
        </div>
        <div className="fa-p12 fa-border-b " style={{ width: 80 }}>
          操作
        </div>
      </div>
      <FaSortList
        list={array}
        renderItem={(i) => <DictDataForm dict={i} onChange={handleEdit} onDelete={handleDel} />}
        itemStyle={{ borderBottom: '1px solid var(--fa-border-color)', position: 'relative', cursor: 'default' }}
        onSortEnd={(l) => handleChangeList(l)}
        vertical
        handle
        handleStyle={{ position: 'absolute', right: 10, top: 7 }}
      />
      <DictDataForm onChange={handleAdd} />
    </FaFlexRestLayout>
  )
}
