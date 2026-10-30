import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PageExceptionProps } from './PageException';
import PageNotFound from './PageNotFound';

const preview = vi.hoisted(() => ({ navigate: vi.fn(), props: undefined as PageExceptionProps | undefined }));
vi.mock('react-router-dom', () => ({ useNavigate: () => preview.navigate }));
vi.mock('./PageException', () => ({
  default: (props: PageExceptionProps) => { preview.props = props; return null; },
}));

beforeEach(() => {
  vi.clearAllMocks();
  preview.props = undefined;
  vi.stubGlobal('window', { history: { length: 1 } });
});
afterEach(() => vi.unstubAllGlobals());

describe('PageNotFound 路由兼容与演示操作', () => {
  it('默认返回根路径，使用替换导航', () => {
    renderToStaticMarkup(<PageNotFound />);
    preview.props?.onPrimary?.();
    expect(preview.navigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('保留自定义首页地址，并在没有历史时回到该首页', () => {
    renderToStaticMarkup(<PageNotFound homePath="/admin/home/desktop" />);
    preview.props?.onPrimary?.();
    preview.props?.onSecondary?.();
    expect(preview.navigate).toHaveBeenCalledTimes(2);
    expect(preview.navigate).toHaveBeenNthCalledWith(1, '/admin/home/desktop', { replace: true });
    expect(preview.navigate).toHaveBeenNthCalledWith(2, '/admin/home/desktop', { replace: true });
  });

  it('存在历史记录时返回上一页', () => {
    vi.stubGlobal('window', { history: { length: 2 } });
    renderToStaticMarkup(<PageNotFound />);
    preview.props?.onSecondary?.();
    expect(preview.navigate).toHaveBeenCalledWith(-1);
  });

  it('允许展示页提供模拟操作，两种按钮均不会触发真实导航', () => {
    const onHome = vi.fn();
    const onBack = vi.fn();
    renderToStaticMarkup(<PageNotFound onHome={onHome} onBack={onBack} />);
    expect(preview.props?.status).toBe('404');
    preview.props?.onPrimary?.();
    preview.props?.onSecondary?.();
    expect(onHome).toHaveBeenCalledOnce();
    expect(onBack).toHaveBeenCalledOnce();
    expect(preview.navigate).not.toHaveBeenCalled();
  });
});
