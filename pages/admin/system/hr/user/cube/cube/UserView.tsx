import { Badge, Card, Descriptions, Tag } from 'antd';
import { type Admin, FaEnums } from '@/types';

export interface UserViewProps {
  item: Admin.User;
}

function renderSex(value: Admin.User['sex']) {
  switch (value) {
    case FaEnums.SexEnum.FEMALE:
      return '女';
    case FaEnums.SexEnum.MALE:
      return '男';
    default:
      return '未知';
  }
}

function renderWorkStatus(value: Admin.User['workStatus']) {
  switch (value) {
    case FaEnums.UserWorkStatusEnum.ON_JOB:
      return <Badge status="success" text="在职" />;
    case FaEnums.UserWorkStatusEnum.ASK_LEAVE:
      return <Badge status="warning" text="请假" />;
    case FaEnums.UserWorkStatusEnum.DEPART:
      return <Badge status="error" text="离职" />;
    default:
      return '-';
  }
}

function renderBoolean(value: boolean, enabled: string, disabled: string) {
  return <Tag color={value ? 'success' : 'default'}>{value ? enabled : disabled}</Tag>;
}

/**
 * BASE-用户实体详情查看
 */
export default function UserView({ item }: UserViewProps) {
  return (
    <div className="fa-flex-column" style={{ gap: 12 }}>
      <Card title="基本资料">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="用户 ID">{item.id}</Descriptions.Item>
          <Descriptions.Item label="账户">{item.username}</Descriptions.Item>
          <Descriptions.Item label="姓名">{item.name}</Descriptions.Item>
          <Descriptions.Item label="手机号">{item.tel}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{item.email}</Descriptions.Item>
          <Descriptions.Item label="性别">{renderSex(item.sex)}</Descriptions.Item>
          <Descriptions.Item label="生日">{item.birthday}</Descriptions.Item>
          <Descriptions.Item label="地址">{item.address}</Descriptions.Item>
          <Descriptions.Item label="头像 URL" span={2}>
            {item.img || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>
            {item.description || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="组织与权限">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="部门">{item.departmentName || '-'}</Descriptions.Item>
          <Descriptions.Item label="部门 ID">{item.departmentId}</Descriptions.Item>
          <Descriptions.Item label="职位">{item.postName || '-'}</Descriptions.Item>
          <Descriptions.Item label="角色">{item.roleNames || '-'}</Descriptions.Item>
          <Descriptions.Item label="后台访问">{renderBoolean(item.adminEnabled, '允许', '禁止')}</Descriptions.Item>
          <Descriptions.Item label="超级管理员">{renderBoolean(item.superAdmin, '是', '否')}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="账号状态">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="账户状态">{renderBoolean(item.status, '有效', '停用')}</Descriptions.Item>
          <Descriptions.Item label="工作状态">{renderWorkStatus(item.workStatus)}</Descriptions.Item>
          <Descriptions.Item label="最后在线时间">{item.lastOnlineTime || '-'}</Descriptions.Item>
          <Descriptions.Item label="是否删除">{renderBoolean(Boolean(item.deleted), '是', '否')}</Descriptions.Item>
          <Descriptions.Item label="开放平台唯一标识">{item.wxUnionId || '-'}</Descriptions.Item>
          <Descriptions.Item label="微信小程序用户标识">{item.wxMaOpenid || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="审计信息">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="创建时间">{item.crtTime || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建用户">{item.crtName || item.crtUser || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建用户 ID">{item.crtUser || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建 IP">{item.crtHost || '-'}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{item.updTime || '-'}</Descriptions.Item>
          <Descriptions.Item label="更新用户">{item.updName || item.updUser || '-'}</Descriptions.Item>
          <Descriptions.Item label="更新用户 ID">{item.updUser || '-'}</Descriptions.Item>
          <Descriptions.Item label="更新 IP">{item.updHost || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
