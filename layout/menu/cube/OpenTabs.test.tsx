import { useContext, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import MenuLayoutContext, { type OpenTabsItem } from '../context/MenuLayoutContext';
import OpenTabs from './OpenTabs';
import OpenTabsMenu from './OpenTabsMenu';

vi.mock('@features/fa-admin-pages/components/icons/FaIconPro', () => ({ default: () => <span /> }));

const home: OpenTabsItem = { key: 'home', name: '工作台', path: '/admin/home/desktop', pinned: true, closeable: false };
const monitor: OpenTabsItem = { key: 'monitor', name: '监控页', path: '/admin/home/monitor' };

function renderWithTabs(children: ReactNode, tabs: OpenTabsItem[]) {
  function Fixture() {
    const defaults = useContext(MenuLayoutContext);
    return <MenuLayoutContext.Provider value={{ ...defaults, openTabs: tabs, curTab: home }}>{children}</MenuLayoutContext.Provider>;
  }
  return renderToStaticMarkup(<Fixture />);
}

function menuButton(markup: string, label: string) {
  const buttons = [...markup.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
  const button = buttons.find((match) => match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, '') === label);
  expect(button, `找不到菜单操作：${label}`).toBeDefined();
  return button![1];
}

describe('固定工作台的标签栏', () => {
  it('只剩工作台时仍显示入口，并且不显示关闭按钮', () => {
    const markup = renderWithTabs(<OpenTabs />, [home]);
    expect(markup).toContain('fa-menu-pinned-tabs');
    expect(markup).toContain('title="工作台（固定）"');
    expect(markup).toContain('aria-current="page"');
    expect(markup).not.toContain('fa-tab-menu-item-close');
  });

  it('固定入口位于滚动区之外，业务标签仍显示关闭按钮', () => {
    const markup = renderWithTabs(<OpenTabs />, [home, monitor]);
    expect(markup.indexOf('fa-menu-pinned-tabs')).toBeLessThan(markup.indexOf('fa-menu-top'));
    expect(markup.match(/class="fa-tab-menu-item-close"/g)).toHaveLength(1);
  });
});

describe('固定工作台的操作菜单', () => {
  it('工作台不可关闭，有业务标签时仍可关闭右侧或其他标签', () => {
    const markup = renderWithTabs(<OpenTabsMenu targetTabKey="home" />, [home, monitor]);
    expect(menuButton(markup, '关闭')).toContain('disabled');
    expect(menuButton(markup, '关闭左侧')).toContain('disabled');
    expect(menuButton(markup, '关闭右侧')).not.toContain('disabled');
    expect(menuButton(markup, '关闭其他')).not.toContain('disabled');
  });

  it('仅剩工作台时禁用所有关闭操作，保留重新加载', () => {
    const markup = renderWithTabs(<OpenTabsMenu targetTabKey="home" />, [home]);
    for (const label of ['关闭', '关闭左侧', '关闭右侧', '关闭其他']) {
      expect(menuButton(markup, label)).toContain('disabled');
    }
    expect(menuButton(markup, '重新加载')).not.toContain('disabled');
  });
});
