import type { CSSProperties, ReactNode } from 'react';
import { theme } from 'antd';
import './monitor.scss';

interface MonitorCardProps {
  title: string;
  icon: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
}

export default function MonitorCard({ title, icon, extra, children }: MonitorCardProps) {
  const { token } = theme.useToken();

  return (
    <section
      className="monitor-card"
      style={
        {
          '--monitor-text': token.colorText,
          '--monitor-muted': token.colorTextSecondary,
          '--monitor-border': token.colorBorderSecondary,
          '--monitor-fill': token.colorFillTertiary,
          '--monitor-accent': token.colorPrimary,
          '--monitor-accent-bg': token.colorPrimaryBg,
          '--monitor-success': token.colorSuccess,
          '--monitor-warning': token.colorWarning,
          '--monitor-error': token.colorError,
          background: token.colorBgContainer,
        } as CSSProperties
      }
    >
      <header className="monitor-card-header">
        <span className="monitor-card-icon" aria-hidden="true">
          {icon}
        </span>
        <h3>{title}</h3>
        <span className="monitor-card-extra">{extra}</span>
      </header>
      <div className="monitor-card-body">{children}</div>
    </section>
  );
}
