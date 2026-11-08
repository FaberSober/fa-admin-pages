interface RegisteredTask {
  value: unknown;
  label: unknown;
}

/** 后台 getAllJobs 扫描 @FaJob 注册类，value 为完整包名加类名。 */
export function getFlowTaskOptions(tasks: RegisteredTask[]) {
  const seen = new Set<string>();
  return tasks.flatMap((task) => {
    if (typeof task.value !== 'string' || !task.value.trim() || seen.has(task.value)) return [];
    seen.add(task.value);
    const name = typeof task.label === 'string' && task.label.trim() ? task.label : task.value;
    return [{ value: task.value, name, label: `${name} · ${task.value}` }];
  });
}
