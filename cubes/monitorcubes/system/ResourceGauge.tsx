interface ResourceGaugeProps {
  label: string;
  value?: number;
}

export default function ResourceGauge({ label, value }: ResourceGaugeProps) {
  const percent = Math.min(100, Math.max(0, value ?? 0));
  const color = percent >= 85 ? 'var(--monitor-error)' : percent >= 70 ? 'var(--monitor-warning)' : 'var(--monitor-accent)';

  return (
    <svg className="monitor-gauge" viewBox="0 0 240 195" role="img" aria-label={`${label}使用率：${value === undefined ? '暂无数据' : `${percent}%`}`}>
      <title>{label}使用率</title>
      <path d="M33.4 160 A100 100 0 1 1 206.6 160" fill="none" stroke="var(--monitor-fill)" strokeWidth="10" strokeLinecap="round" />
      <path
        className="monitor-gauge-progress"
        d="M33.4 160 A100 100 0 1 1 206.6 160"
        pathLength="100"
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${percent} 100`}
        opacity={percent > 0 ? 1 : 0}
      />
      <text x="120" y="112" textAnchor="middle" className="monitor-gauge-value">
        {value === undefined ? '—' : Number(percent.toFixed(2))}
        {value !== undefined && <tspan className="monitor-gauge-unit"> %</tspan>}
      </text>
      <text x="120" y="137" textAnchor="middle" className="monitor-gauge-label">
        使用率
      </text>
      <text x="33" y="185" textAnchor="middle" className="monitor-gauge-label">
        0%
      </text>
      <text x="207" y="185" textAnchor="middle" className="monitor-gauge-label">
        100%
      </text>
    </svg>
  );
}
