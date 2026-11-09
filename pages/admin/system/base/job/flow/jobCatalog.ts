import type { Admin } from '@/types';
export function filterCatalog(tasks: Admin.RegisteredJob[], query: string, showDeprecated: boolean) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return tasks.filter(task => (showDeprecated || !task.deprecated) && words.every(word =>
    [task.name, task.description, task.clazzPath, task.group, ...task.tags].join(' ').toLocaleLowerCase().includes(word)))
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name) || a.clazzPath.localeCompare(b.clazzPath));
}
export const catalogGroup = (task: Admin.RegisteredJob) => task.group.trim() || '未分组';
