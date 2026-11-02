import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import ConfigLayoutContext, { type ConfigLayoutContextProps } from '../../layout/config/context/ConfigLayoutContext';
import FaIconPro from './FaIconPro';
import { loadMdiIcons } from './mdi';

vi.mock('@fa/icons', () => ({
  FaIcon: ({ icon }: { icon: string }) => <span data-font-awesome={icon} />,
}));
vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-online-icon={icon} />,
}));

beforeAll(async () => { await loadMdiIcons(); });

function renderIcon(offline: boolean, icon = 'mdi:house-outline') {
  const config = { systemConfig: { offline }, refreshSystemConfig: () => {} } as ConfigLayoutContextProps;
  return renderToStaticMarkup(
    <ConfigLayoutContext.Provider value={config}>
      <FaIconPro icon={icon} width={24} />
    </ConfigLayoutContext.Provider>,
  );
}

describe('FaIconPro 环境选择', () => {
  it('在线模式使用 Iconify 在线入口', () => {
    expect(renderIcon(false)).toContain('data-online-icon="mdi:house-outline"');
  });

  it('离线模式使用已注册的本地图标，保留尺寸设置', () => {
    const markup = renderIcon(true);
    expect(markup).toContain('<svg');
    expect(markup).toContain('width="24"');
    expect(markup).not.toContain('data-online-icon');
  });

  it('未获得系统配置时也不使用在线入口', () => {
    const markup = renderToStaticMarkup(<FaIconPro icon="mdi:house-outline" />);
    expect(markup).toContain('<svg');
    expect(markup).not.toContain('data-online-icon');
  });

  it('两种模式均保留 Font Awesome 图标', () => {
    for (const offline of [true, false]) {
      expect(renderIcon(offline, 'fas fa-house')).toContain('data-font-awesome="fas fa-house"');
    }
  });
});
