import { createContext } from "react";
import { Admin } from "@features/fa-admin-pages/types";

export interface ConfigLayoutContextProps {
  systemConfig: Admin.SystemConfigPo;
}

export const ConfigLayoutContext = createContext<ConfigLayoutContextProps>({} as any);

export default ConfigLayoutContext