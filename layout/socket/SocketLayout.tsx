import React, { ReactNode, useContext, useEffect } from 'react';
import { useSocketIO } from '@/hooks';
import SocketLayoutContext, { SocketLayoutContextProps } from './context/SocketLayoutContext';
import { UserLayoutContext } from "../user/context/UserLayoutContext";

export interface SocketLayoutProps {
  children?: ReactNode | Element;
}

/**
 * Socket长连接Container
 * @author xu.pengfei
 * @date 2021/11/11 14:43
 */
export default function SocketLayout({ children }: SocketLayoutProps) {
  const { user } = useContext(UserLayoutContext);
  // const { ready, socketEmit, socketInstance } = useSocketIO(systemConfig.socketServer)
  const { ready, socketEmit, socketInstance } = useSocketIO({});

  useEffect(() => {
    if (!ready) return;
    if (user.id === '0') return;
    if (socketInstance === undefined) return;

    console.log('socketInstance', socketInstance);
    socketInstance.emit('login', { userId: user.id });
  }, [ready, user, socketInstance]);

  const contextValue: SocketLayoutContextProps = {
    socketInstance,
    sendSocketMsg: socketEmit,
  };

  return (
    <SocketLayoutContext.Provider value={contextValue}>
      <>{children}</>
    </SocketLayoutContext.Provider>
  );
}
