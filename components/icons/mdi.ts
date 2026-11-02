import { addCollection } from '@iconify/react/offline';

let mdiIconsPromise: Promise<string[]> | undefined;

export function loadMdiIcons(): Promise<string[]> {
  // 动态导入，在线页面无需下载完整 MDI 集合。
  mdiIconsPromise ??= import('@iconify-json/mdi/icons.json').then(({ default: collection }) => {
    addCollection(collection);
    return [...Object.keys(collection.icons), ...Object.keys(collection.aliases ?? {})].sort();
  }).catch((error) => {
    mdiIconsPromise = undefined;
    throw error;
  });
  return mdiIconsPromise;
}
