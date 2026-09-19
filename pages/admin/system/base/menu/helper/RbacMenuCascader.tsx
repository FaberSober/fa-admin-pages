import { BaseCascader, type BaseCascaderProps, type Fa, FaEnums } from '@fa/ui';
import { rbacMenuApi } from '@features/fa-admin-pages/services';
import type { Rbac } from '@/types';

export interface RbacMenuCascaderProps extends Omit<BaseCascaderProps<Rbac.RbacMenu, string>, 'serviceApi'> {
  scope: FaEnums.RbacMenuScopeEnum;
  childLevel?: FaEnums.RbacMenuLevelEnum;
}

type MenuTreeNode = Fa.TreeNode<Rbac.RbacMenu, string>;

function canBeParent(childLevel: FaEnums.RbacMenuLevelEnum | undefined, parentLevel: FaEnums.RbacMenuLevelEnum | undefined): boolean {
  if (childLevel === FaEnums.RbacMenuLevelEnum.BUTTON) {
    return parentLevel === FaEnums.RbacMenuLevelEnum.MENU;
  }
  return parentLevel === FaEnums.RbacMenuLevelEnum.APP || parentLevel === FaEnums.RbacMenuLevelEnum.MENU;
}

function canNavigateToChildren(childLevel: FaEnums.RbacMenuLevelEnum | undefined, parentLevel: FaEnums.RbacMenuLevelEnum | undefined): boolean {
  return childLevel === FaEnums.RbacMenuLevelEnum.BUTTON && parentLevel === FaEnums.RbacMenuLevelEnum.APP;
}

function markInvalidParents(
  nodes: MenuTreeNode[] | undefined,
  childLevel: FaEnums.RbacMenuLevelEnum | undefined,
  disabledIds: Set<string>,
  ancestorDisabled = false,
): MenuTreeNode[] | undefined {
  if (!nodes) return undefined;

  return nodes.map((node) => {
    const isDisabled = ancestorDisabled || disabledIds.has(String(node.id));
    const parentLevel = node.sourceData?.level;
    return {
      ...node,
      disabled: Boolean(node.disabled || isDisabled || (!canBeParent(childLevel, parentLevel) && !canNavigateToChildren(childLevel, parentLevel))),
      children: markInvalidParents(node.children, childLevel, disabledIds, isDisabled),
    };
  });
}

type MenuSelection = MenuTreeNode | MenuTreeNode[] | undefined;

function isValidParentSelection(childLevel: FaEnums.RbacMenuLevelEnum | undefined, selection: MenuSelection): boolean {
  if (!selection) return true;
  if (Array.isArray(selection)) {
    return selection.every((item) => canBeParent(childLevel, item.sourceData?.level));
  }
  return canBeParent(childLevel, selection.sourceData?.level);
}

/**
 * @author xu.pengfei
 * @date 2020/12/25
 */
export default function RbacMenuCascader({ scope, childLevel, disabledIds, extraParams = [], onChange, onChangeWithItem, ...props }: RbacMenuCascaderProps) {
  const excludedIds = new Set((disabledIds || []).map((id) => String(id)));

  return (
    <BaseCascader
      showRoot={false}
      serviceApi={{
        ...rbacMenuApi,
        allTree: () =>
          rbacMenuApi.getTree({ query: { scope } }).then((res) => ({
            ...res,
            data: markInvalidParents(res.data, childLevel, excludedIds),
          })),
      }}
      placeholder="请选择菜单"
      extraParams={[scope, childLevel, [...excludedIds].join(','), ...extraParams]}
      {...props}
      onChange={(value, lastItem, valueList, itemList) => {
        if (!isValidParentSelection(childLevel, lastItem)) {
          return;
        }
        onChange?.(value, lastItem, valueList, itemList);
      }}
      onChangeWithItem={onChangeWithItem}
    />
  );
}
