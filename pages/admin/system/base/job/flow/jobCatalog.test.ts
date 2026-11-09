import { expect, it } from 'vitest';
import type { Admin } from '@/types';
import { catalogGroup, filterCatalog } from './jobCatalog';
const task = (overrides: Partial<Admin.RegisteredJob> = {}): Admin.RegisteredJob => ({ clazzPath: 'com.example.Archive', name: '日志归档', group: '', description: '按月保存日志', tags: ['存储'], sort: 0, deprecated: false, ...overrides });
it('searches across metadata with case insensitive multiple words', () => {
  expect(filterCatalog([task()], 'ARCHIVE 存储', false)).toHaveLength(1);
  expect(filterCatalog([task()], '不存在', false)).toHaveLength(0);
});
it('hides deprecated by default and preserves explicit visibility', () => {
  expect(filterCatalog([task({ deprecated: true })], '', false)).toHaveLength(0);
  expect(filterCatalog([task({ deprecated: true })], '', true)).toHaveLength(1);
});
it('normalizes empty groups and sorts stable by priority then name', () => {
  expect(catalogGroup(task({ group: '  ' }))).toBe('未分组');
  expect(filterCatalog([task({ sort: 2 }), task({ name: '优先', sort: 1 })], '', false)[0].name).toBe('优先');
});
