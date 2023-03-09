// import { Fa } from '@fa/ui';

namespace Generator {

  // ------------------------------------------------- VO -------------------------------------------------
  /** 表结构 */
  export interface TableVo {
    tableName: string;
    engine: string;
    tableComment: string;
    createTime: string;
  }


  // ------------------------------------------------- VO-Query -------------------------------------------------
  export interface TableQueryVo {
    name?: string;
  }

}

export default Generator;
