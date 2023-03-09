import { BaseZeroApi, Fa } from "@fa/ui";
import { GATE_APP } from "@/configs";
import { Generator } from "@/types";

class Api extends BaseZeroApi {

  /** 查询表 */
  pageTable = (params: Fa.BasePageQuery<Generator.TableQueryVo>): Promise<Fa.Ret<Fa.Page<Generator.TableVo>>> => this.post('pageTable', params);

}

export default new Api(GATE_APP.generator, 'generator');
