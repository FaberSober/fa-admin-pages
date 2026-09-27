import { ApartmentOutlined, ArrowDownOutlined, HolderOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { FaSortList } from '@fa/ui';
import { fileSaveApi, tenantApi, tenantUserApi } from '@features/fa-admin-pages/services';
import type { Tn } from '@features/fa-admin-pages/types';
import { Avatar, Badge, Button, message, Popover, Tag, Tooltip } from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import UserLayoutContext from '../../user/context/UserLayoutContext';
import './TenantSelect.scss';

/** 租户切换面板。 */
export default function TenantSelect() {
  const { tenants, selectedTenant, switchTenant, refreshTenants, tenantUnreadCounts, totalTenantUnreadCount, refreshTenantUnreadCounts } =
    useContext(UserLayoutContext);
  const [open, setOpen] = useState(false);
  const [orderedTenants, setOrderedTenants] = useState<Tn.TenantUser[]>(tenants);
  const [saving, setSaving] = useState(false);
  const [unreadLoadFailed, setUnreadLoadFailed] = useState(false);

  useEffect(() => {
    setOrderedTenants(tenants);
  }, [tenants]);

  if (!selectedTenant || tenants.length <= 1) {
    return null;
  }

  const currentTenant = selectedTenant;
  const isSuperAdmin = orderedTenants[0]?.isSuperAdmin === true;
  const defaultTenantId = orderedTenants[0]?.tenantId;

  async function saveTenantOrder(nextTenants: Tn.TenantUser[]) {
    if (saving) return;

    const previousTenants = orderedTenants;
    const sortedTenants = nextTenants.map((tenant, index) => ({
      ...tenant,
      sort: index + 1,
      isDefault: index === 0,
    }));
    setOrderedTenants(sortedTenants);
    setSaving(true);
    try {
      const tenantIds = sortedTenants.map((tenant) => tenant.tenantId);
      const response = isSuperAdmin
        ? await tenantApi.savePanelOrder(tenantIds)
        : await tenantUserApi.saveMyTenantOrder(tenantIds);
      if (response.status !== 200) {
        throw new Error(response.message || '保存租户排序失败');
      }
      setOrderedTenants(response.data || sortedTenants);
      await refreshTenants();
      message.success('租户排序已保存');
    } catch (error) {
      setOrderedTenants(previousTenants);
      message.error(error instanceof Error ? error.message : '保存租户排序失败');
    } finally {
      setSaving(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setUnreadLoadFailed(false);
      void refreshTenantUnreadCounts().then((loaded) => setUnreadLoadFailed(!loaded));
    }
  }

  function handleRetryUnreadCounts() {
    setUnreadLoadFailed(false);
    void refreshTenantUnreadCounts().then((loaded) => setUnreadLoadFailed(!loaded));
  }

  function handleSelectTenant(tenantId: string) {
    setOpen(false);
    if (tenantId !== currentTenant.tenantId) {
      switchTenant(tenantId);
    }
  }

  function handleSetDefault(event: React.MouseEvent, tenantId: string) {
    event.stopPropagation();
    if (isSuperAdmin || tenantId === defaultTenantId) return;
    const selectedTenant = orderedTenants.find((tenant) => tenant.tenantId === tenantId);
    if (!selectedTenant) return;
    const nextTenants = [selectedTenant, ...orderedTenants.filter((tenant) => tenant.tenantId !== tenantId)];
    void saveTenantOrder(nextTenants);
  }

  function renderTenantRow(tenant: Tn.TenantUser) {
    const unreadCount = tenantUnreadCounts[tenant.tenantId] ?? 0;
    const tenantName = tenant.tenantName || tenant.tenantId;
    const iconUrl = tenant.tenantIcon ? fileSaveApi.genLocalGetFile(tenant.tenantIcon) : undefined;
    const isSelected = tenant.tenantId === currentTenant.tenantId;

    return (
      <div className={`tenant-select-row${isSelected ? ' is-selected' : ''}${isSuperAdmin ? ' is-super-admin' : ''}`}>
        <button type="button" className="tenant-select-row-main" onClick={() => handleSelectTenant(tenant.tenantId)} disabled={saving} title={tenantName}>
          <Avatar className="tenant-select-avatar" size={36} src={iconUrl} icon={<ApartmentOutlined />} />
          <span className="tenant-select-row-copy">
            <span className="tenant-select-row-name">{tenantName}</span>
            <span className="tenant-select-row-tags">
              {isSelected && <Tag color="blue">当前</Tag>}
              {tenant.isAdmin && <Tag>管理员</Tag>}
            </span>
          </span>
          {unreadCount > 0 && <Badge count={unreadCount} overflowCount={99} />}
        </button>
        {!isSuperAdmin && (
          <Tooltip title={tenant.tenantId === defaultTenantId ? '当前默认租户' : '设为默认租户'}>
            <Button
              type="text"
              className="tenant-select-default-btn"
              aria-label={tenant.tenantId === defaultTenantId ? `${tenantName}已是默认租户` : `将${tenantName}设为默认租户`}
              icon={tenant.tenantId === defaultTenantId ? <StarFilled /> : <StarOutlined />}
              disabled={saving || tenant.tenantId === defaultTenantId}
              onClick={(event) => handleSetDefault(event, tenant.tenantId)}
            />
          </Tooltip>
        )}
      </div>
    );
  }

  const panel = (
    <div className="tenant-select-panel" aria-busy={saving}>
      <div className="tenant-select-panel-header">
        <div className="tenant-select-panel-title">切换租户</div>
      </div>

      <div className={`tenant-select-list${saving ? ' is-saving' : ''}`}>
        <FaSortList
          list={orderedTenants}
          rowKey="tenantId"
          renderItem={(tenant: Tn.TenantUser) => renderTenantRow(tenant)}
          onSortEnd={(nextTenants: Tn.TenantUser[]) => void saveTenantOrder(nextTenants)}
          itemStyle={{ marginBottom: 4, borderRadius: 10, overflow: 'hidden' }}
          containerStyle={{ padding: 2 }}
          vertical
          handle
          handleNode={<HolderOutlined />}
        />
      </div>

      {unreadLoadFailed && (
        <div className="tenant-select-unread-error" aria-live="polite">
          <span>未读数量加载失败</span>
          <Button type="link" size="small" onClick={handleRetryUnreadCounts}>
            重试
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Popover content={panel} trigger="click" placement="bottomRight" open={open} onOpenChange={handleOpenChange}>
      <button type="button" className="tenant-select-trigger" aria-expanded={open}>
        <Avatar
          className="tenant-select-trigger-avatar"
          size={24}
          src={currentTenant.tenantIcon ? fileSaveApi.genLocalGetFile(currentTenant.tenantIcon) : undefined}
          icon={<ApartmentOutlined />}
        />
        <span className="tenant-select-trigger-name" title={currentTenant.tenantName || currentTenant.tenantId}>
          {currentTenant.tenantName || currentTenant.tenantId}
        </span>
        {totalTenantUnreadCount > 0 && <Badge count={totalTenantUnreadCount} overflowCount={99} />}
        <ArrowDownOutlined className="tenant-select-trigger-arrow" />
      </button>
    </Popover>
  );
}
