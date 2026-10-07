import type { CSSProperties } from 'react';
import './captcha.scss';

export interface SliderPuzzleCaptchaProps {
  backgroundUrl: string;
  pieceUrl: string;
  maxOffset: number;
  boardWidth?: number;
  boardHeight?: number;
  pieceWidth?: number;
  pieceHeight?: number;
  pieceTop?: number;
  value?: number;
  disabled?: boolean;
  onChange?: (offset: number) => void;
}

/**
 * 展示调用方提供的拼图挑战，并通过原生 range 控件收集拖动位置。
 */
export default function SliderPuzzleCaptcha({
  backgroundUrl,
  pieceUrl,
  maxOffset,
  boardWidth = 320,
  boardHeight = 132,
  pieceWidth = 48,
  pieceHeight = 48,
  pieceTop = 26,
  value = 0,
  disabled = false,
  onChange,
}: SliderPuzzleCaptchaProps) {
  const safeMaxOffset = Math.max(0, maxOffset);
  const currentOffset = Math.min(safeMaxOffset, Math.max(0, value));
  const progress = safeMaxOffset === 0 ? 0 : currentOffset / safeMaxOffset;
  const safeBoardWidth = Math.max(1, boardWidth);
  const safeBoardHeight = Math.max(1, boardHeight);
  const pieceWidthPercent = Math.min(100, Math.max(0, (pieceWidth / safeBoardWidth) * 100));
  const pieceHeightPercent = Math.min(100, Math.max(0, (pieceHeight / safeBoardHeight) * 100));
  const pieceStyle: CSSProperties = {
    left: progress * (100 - pieceWidthPercent) + '%',
    top: (pieceTop / safeBoardHeight) * 100 + '%',
    width: pieceWidthPercent + '%',
    height: pieceHeightPercent + '%',
  };

  return (
    <div className="fa-captcha-slider" style={{ width: safeBoardWidth, maxWidth: '100%' }}>
      <div className="fa-captcha-slider__board" style={{ aspectRatio: safeBoardWidth + ' / ' + safeBoardHeight }}>
        <img className="fa-captcha-slider__background" src={backgroundUrl} alt="" />
        <img className="fa-captcha-slider__piece" src={pieceUrl} alt="" style={pieceStyle} />
      </div>
      <input
        aria-label="拖动拼图块到缺口"
        aria-valuetext={currentOffset + ' 像素'}
        className="fa-captcha-slider__control"
        disabled={disabled}
        max={safeMaxOffset}
        min={0}
        onChange={(event) => onChange?.(Number(event.target.value))}
        type="range"
        value={currentOffset}
      />
      <span className="fa-captcha-sr-only">可使用方向键调整拼图位置</span>
    </div>
  );
}
