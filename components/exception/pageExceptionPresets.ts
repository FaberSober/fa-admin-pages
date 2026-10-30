export type PageExceptionStatus = '401' | '403' | '404' | '429' | '500' | '502' | '503' | '504' | 'network' | 'timeout' | 'render-error';
export type PageExceptionGroup = 'http' | 'client';

export interface PageExceptionPreset {
  status: PageExceptionStatus;
  group: PageExceptionGroup;
  code: string;
  label: string;
  caption: string;
  title: string;
  description: string;
  primaryText: string;
  secondaryText: string;
}

export const pageExceptionPresets: readonly PageExceptionPreset[] = [
  {
    status: '401', group: 'http', code: '401', label: '未登录', caption: 'UNAUTHORIZED',
    title: '请先登录', description: '登录状态已过期，或你还没有登录。\n请重新登录后继续操作。',
    primaryText: '重新登录', secondaryText: '返回首页',
  },
  {
    status: '403', group: 'http', code: '403', label: '无访问权限', caption: 'FORBIDDEN',
    title: '暂无访问权限', description: '你当前的账号没有访问此页面的权限。\n可以联系管理员，或返回首页继续操作。',
    primaryText: '返回首页', secondaryText: '返回上一页',
  },
  {
    status: '404', group: 'http', code: '404', label: '页面不存在', caption: 'PAGE NOT FOUND',
    title: '页面走丢了', description: '可能是地址有误，或页面已被移动。\n你可以检查网址，或返回首页继续操作。',
    primaryText: '返回首页', secondaryText: '返回上一页',
  },
  {
    status: '429', group: 'http', code: '429', label: '请求过于频繁', caption: 'TOO MANY REQUESTS',
    title: '操作太频繁了', description: '短时间内的请求次数有点多。\n请稍等片刻，再继续操作。',
    primaryText: '稍后重试', secondaryText: '返回首页',
  },
  {
    status: '500', group: 'http', code: '500', label: '服务器异常', caption: 'INTERNAL SERVER ERROR',
    title: '系统开了个小差', description: '服务遇到了一些临时问题。\n可以重新加载页面，或稍后再试。',
    primaryText: '重新加载', secondaryText: '返回首页',
  },
  {
    status: '502', group: 'http', code: '502', label: '网关异常', caption: 'BAD GATEWAY',
    title: '服务连接异常', description: '网关暂时无法连接目标服务。\n请稍后重试，或返回首页继续操作。',
    primaryText: '重新尝试', secondaryText: '返回首页',
  },
  {
    status: '503', group: 'http', code: '503', label: '服务不可用', caption: 'SERVICE UNAVAILABLE',
    title: '服务暂时不可用', description: '系统正在维护，或当前服务繁忙。\n请稍后再来，我们会尽快恢复。',
    primaryText: '稍后重试', secondaryText: '返回首页',
  },
  {
    status: '504', group: 'http', code: '504', label: '网关超时', caption: 'GATEWAY TIMEOUT',
    title: '服务响应超时', description: '网关等待目标服务响应的时间过长。\n请稍后重试，或返回首页继续操作。',
    primaryText: '重新尝试', secondaryText: '返回首页',
  },
  {
    status: 'network', group: 'client', code: 'NETWORK', label: '网络断开', caption: 'NETWORK ERROR',
    title: '网络连接已断开', description: '暂时无法连接到服务器。\n请检查网络连接，然后重新尝试。',
    primaryText: '重新连接', secondaryText: '返回首页',
  },
  {
    status: 'timeout', group: 'client', code: 'TIMEOUT', label: '请求超时', caption: 'REQUEST TIMEOUT',
    title: '请求等待超时', description: '这次请求未能在预期时间内完成。\n请检查网络连接，或稍后重新尝试。',
    primaryText: '重新尝试', secondaryText: '返回首页',
  },
  {
    status: 'render-error', group: 'client', code: 'RENDER', label: '渲染异常', caption: 'RENDER ERROR',
    title: '页面渲染异常', description: '页面加载时遇到了一些问题。\n可以重新加载页面，恢复后继续操作。',
    primaryText: '重新加载', secondaryText: '返回首页',
  },
];
