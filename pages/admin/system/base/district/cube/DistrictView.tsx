import React, { useState, useEffect } from 'react';
import { Descriptions, Tag } from 'antd';
import { FaUtils } from '@fa/ui';
import { userApi } from '@features/fa-admin-pages/services';
import { Htm, Admin } from '@/types';

interface DistrictViewProps {
  record: Htm.District;
}

/** 状态枚举 Map */
const STATUS_MAP: Record<number, { text: string; color: string }> = {
  0: { text: '禁用', color: 'red' },
  1: { text: '启用', color: 'green' },
};

/**
 * 辖区管理详情展示组件
 */
export default function DistrictView({ record }: DistrictViewProps) {
  const statusInfo = STATUS_MAP[record.status as any] || { text: '未知', color: 'default' };
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  // 加载用户列表
  useEffect(() => {
    loadUserList();
  }, []);

  async function loadUserList() {
    try {
      const res = await userApi.list({});
      if (res && res.data) {
        const map: Record<string, string> = {};
        res.data.forEach((user: Admin.User) => {
          map[user.id] = user.name;
        });
        setUserMap(map);
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
    }
  }

  // 解析并格式化地理围栏JSON
  const formatGeoFence = (geoFence?: string) => {
    if (!geoFence) return '-';
    try {
      const parsed = JSON.parse(geoFence);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return geoFence;
    }
  };

  return (
    <div className="fa-flex-column" style={{ padding: '16px 0' }}>
      {/* 基本信息 */}
      <Descriptions title="基本信息" bordered column={2} size="small">
        <Descriptions.Item label="辖区编码" span={2}>
          <strong style={{ fontSize: '16px', color: '#1890ff' }}>{record.code || '-'}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="辖区名称">{record.name || '-'}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
        </Descriptions.Item>
      </Descriptions>

      {/* 负责人信息 */}
      <Descriptions title="负责人信息" bordered column={2} size="small" style={{ marginTop: 16 }}>
        <Descriptions.Item label="负责人">{record.responsiblePerson ? (userMap[record.responsiblePerson] || '-') : '-'}</Descriptions.Item>
        <Descriptions.Item label="负责人电话">{record.responsibleTel || '-'}</Descriptions.Item>
      </Descriptions>

      {/* 电子围栏信息 */}
      <Descriptions title="电子围栏范围" bordered column={1} size="small" style={{ marginTop: 16 }}>
        <Descriptions.Item label="围栏坐标">
          {record.geoFence ? (
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '4px', 
              margin: 0,
              maxHeight: '400px',
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              {formatGeoFence(record.geoFence)}
            </pre>
          ) : (
            '-'
          )}
        </Descriptions.Item>
      </Descriptions>

      {/* 其他信息 */}
      <Descriptions title="其他信息" bordered column={1} size="small" style={{ marginTop: 16 }}>
        <Descriptions.Item label="备注">{record.remark || '-'}</Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {FaUtils.getDateFullStr(record.crtTime)}
        </Descriptions.Item>
        <Descriptions.Item label="更新时间">
          {FaUtils.getDateFullStr(record.updateTime)}
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
}

