import { Outlet } from 'react-router-dom';
import { ApiEffectLayout } from '@fa/ui';
import { ConfigLayout } from "@/layout";

export default function App() {
  return (
    <ApiEffectLayout>
      <ConfigLayout>
        <Outlet />
      </ConfigLayout>
    </ApiEffectLayout>
  );
}
