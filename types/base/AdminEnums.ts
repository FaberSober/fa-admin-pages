namespace AdminEnums {
  // ------------------------------------ DICT ------------------------------------
  export enum DictTypeEnum {
    LINK_OPTIONS = 1,
    LINK_TREE = 2,
    TEXT = 3,
    OPTIONS = 4,
  }

  export const DictTypeEnumMap = {
    [DictTypeEnum.OPTIONS]: '选择列表',
    [DictTypeEnum.TEXT]: '字符串',
    [DictTypeEnum.LINK_OPTIONS]: '关联列表',
    [DictTypeEnum.LINK_TREE]: '关联树',
  }
}

export default AdminEnums;
