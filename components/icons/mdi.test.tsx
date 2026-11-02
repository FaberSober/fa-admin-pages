import { Icon } from '@iconify/react/offline';
import { iconLoaded } from '@iconify/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadMdiIcons } from './mdi';

afterEach(() => vi.unstubAllGlobals());

describe('本地 MDI 集合', () => {
  it('按需注册离线集合，支持现有图标和别名，不填充在线入口的集合', async () => {
    const fetch = vi.fn(() => { throw new Error('不允许请求外网图标'); });
    vi.stubGlobal('fetch', fetch);
    expect(renderToStaticMarkup(<Icon icon="mdi:chart-box-outline" />)).not.toContain('<svg');

    const loading = loadMdiIcons();
    expect(loadMdiIcons()).toBe(loading);
    const icons = await loading;
    const requested = [
      'chart-box-outline', 'clipboard-text-outline', 'fullscreen', 'grid', 'map-search',
      'monitor-dashboard', 'radar', 'thermometer', 'view-dashboard-outline', 'weather-sunny',
      'weather-windy', 'chart-timeline-variant', 'cog', 'database-check', 'database-outline',
      'house-outline', 'map-outline', 'satellite-variant', 'weather-cloudy-clock', 'weather-partly-cloudy',
    ];
    for (const name of requested) {
      expect(icons).toContain(name);
      expect(renderToStaticMarkup(<Icon icon={`mdi:${name}`} />)).toContain('<svg');
    }
    expect(icons).toEqual([...icons].sort());
    expect(iconLoaded('mdi:chart-box-outline')).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('缺失图标显示空占位，不回退到公网', () => {
    const fetch = vi.fn(() => { throw new Error('不允许请求外网图标'); });
    vi.stubGlobal('fetch', fetch);
    expect(renderToStaticMarkup(<Icon icon="mdi:missing-icon-for-offline-check" />)).not.toContain('<svg');
    expect(fetch).not.toHaveBeenCalled();
  });
});
