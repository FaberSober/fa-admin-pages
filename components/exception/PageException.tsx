import {
  ArrowLeftOutlined, ClockCircleOutlined, CloudServerOutlined, CompassOutlined,
  DisconnectOutlined, HomeOutlined, HourglassOutlined, LockOutlined, LoginOutlined,
  ReloadOutlined, StopOutlined, ToolOutlined, WarningOutlined, WifiOutlined,
} from '@ant-design/icons';
import { Button, theme } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import { pageExceptionPresets, type PageExceptionStatus } from './pageExceptionPresets';
import './PageException.css';

export interface PageExceptionProps {
  status: PageExceptionStatus;
  title?: string;
  description?: ReactNode;
  primaryText?: string;
  secondaryText?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
}

const statusIcons = {
  '401': LockOutlined,
  '403': StopOutlined,
  '404': CompassOutlined,
  '429': HourglassOutlined,
  '500': CloudServerOutlined,
  '502': DisconnectOutlined,
  '503': ToolOutlined,
  '504': ClockCircleOutlined,
  network: WifiOutlined,
  timeout: ClockCircleOutlined,
  'render-error': WarningOutlined,
};

/** 仅展示异常状态，操作由调用方提供，不内置请求或路由副作用。 */
export default function PageException({ status, title, description, primaryText, secondaryText, onPrimary, onSecondary }: PageExceptionProps) {
  const { token } = theme.useToken();
  const preset = pageExceptionPresets.find((item) => item.status === status)!;
  const StatusIcon = statusIcons[status];
  const PrimaryIcon = status === '401' ? LoginOutlined : status === '403' || status === '404' ? HomeOutlined : ReloadOutlined;
  const SecondaryIcon = status === '403' || status === '404' ? ArrowLeftOutlined : HomeOutlined;

  return (
    <section
      className="fa-full-content fa-page-exception"
      aria-label={title ?? preset.title}
      style={{
        '--page-exception-text': token.colorText,
        '--page-exception-muted': token.colorTextSecondary,
        '--page-exception-code': token.colorTextQuaternary,
        '--page-exception-primary': token.colorPrimary,
        '--page-exception-primary-bg': token.colorPrimaryBg,
        '--page-exception-primary-border': token.colorPrimaryBorder,
      } as CSSProperties}
    >
      <div className="fa-page-exception-content">
        <div className="fa-page-exception-visual" aria-hidden="true">
          {preset.group === 'http' && <span className="fa-page-exception-digit">{preset.code[0]}</span>}
          {status === '429' ? (
            <span className="fa-page-exception-digit fa-page-exception-accent">2</span>
          ) : (
            <span className={`fa-page-exception-symbol${status === '404' ? ' fa-page-exception-compass' : ''}`}><StatusIcon /></span>
          )}
          {preset.group === 'http' && <span className="fa-page-exception-digit">{preset.code[2]}</span>}
        </div>
        <div className="fa-page-exception-caption">{preset.group === 'http' ? `${preset.code} / ${preset.caption}` : preset.caption}</div>
        <h1 className="fa-page-exception-title">{title ?? preset.title}</h1>
        <p className="fa-page-exception-description">{description ?? preset.description}</p>
        {(onPrimary || onSecondary) && (
          <div className="fa-page-exception-actions">
            {onPrimary && <Button type="primary" size="large" icon={<PrimaryIcon />} onClick={onPrimary}>{primaryText ?? preset.primaryText}</Button>}
            {onSecondary && <Button size="large" icon={<SecondaryIcon />} onClick={onSecondary}>{secondaryText ?? preset.secondaryText}</Button>}
          </div>
        )}
      </div>
    </section>
  );
}
