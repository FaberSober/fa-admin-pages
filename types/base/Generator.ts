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

  export interface CodeGenReqVo {
    packageName: string;
    tablePrefix: string;
    mainModule: string;
    tableName: string;
    type: string;
  }


  // ------------------------------------------------- VO-Query -------------------------------------------------
  export interface TableQueryVo {
    name?: string;
  }

  export interface CodeGenRetVo extends CodeGenReqVo {
    code: string;
  }

}

export default Generator;
