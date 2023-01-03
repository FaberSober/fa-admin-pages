import { Outlet } from 'react-router-dom';
import { ApiEffectLayout } from '@fa/ui';

export default function App() {
  return (
    <ApiEffectLayout>
      <Outlet />
    </ApiEffectLayout>
  );
}
