import { DragModal, type DragModalProps } from '@fa/ui';
import { Button } from 'antd';
import { cloneElement, isValidElement, type MouseEvent, type ReactNode, useState } from 'react';
import FilePreview, { type FilePreviewProps } from './FilePreview';

type TriggerElementProps = {
  onClick?: (event: MouseEvent<HTMLElement>) => void;
};

export interface FilePreviewModalProps extends Omit<DragModalProps, 'children'>, Omit<FilePreviewProps, 'className' | 'style'> {
  trigger?: ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  previewStyle?: FilePreviewProps['style'];
}

export default function FilePreviewModal({
  trigger,
  fileId,
  mode,
  watermark,
  download,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  onCancel,
  title = '查看文件',
  width = 1000,
  bodyStyle,
  previewStyle,
  ...modalProps
}: FilePreviewModalProps) {
  const [openInternal, setOpenInternal] = useState(defaultOpen);
  const open = openProp ?? openInternal;

  const triggerDom = isValidElement<TriggerElementProps>(trigger)
    ? cloneElement(trigger, {
        onClick: (event) => {
          trigger.props.onClick?.(event);
          updateOpen(true);
        },
      })
    : trigger && (
        <Button type="link" onClick={() => updateOpen(true)}>
          {trigger}
        </Button>
      );

  function updateOpen(nextOpen: boolean) {
    if (openProp === undefined) setOpenInternal(nextOpen);
    onOpenChange?.(nextOpen);
  }

  return (
    <>
      {triggerDom}
      <DragModal
        {...modalProps}
        title={title}
        open={open}
        width={width}
        bodyStyle={{ height: 600, padding: 0, ...bodyStyle }}
        onCancel={(event) => {
          updateOpen(false);
          onCancel?.(event);
        }}
      >
        <FilePreview fileId={fileId} mode={mode} watermark={watermark} download={download} style={previewStyle} />
      </DragModal>
    </>
  );
}
