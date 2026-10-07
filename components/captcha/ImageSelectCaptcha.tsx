import type { ReactNode } from 'react';
import './captcha.scss';

export interface ImageSelectCaptchaItem {
  id: string;
  alt: string;
  content: ReactNode;
}

export interface ImageSelectCaptchaProps {
  instruction: string;
  items: ImageSelectCaptchaItem[];
  value?: string[];
  disabled?: boolean;
  onChange?: (selectedIds: string[]) => void;
}

/**
 * 展示调用方提供的图片选项，并收集用户点选的选项 ID。
 */
export default function ImageSelectCaptcha({ instruction, items, value = [], disabled = false, onChange }: ImageSelectCaptchaProps) {
  function toggleItem(id: string) {
    if (value.includes(id)) {
      onChange?.(value.filter((selectedId) => selectedId !== id));
      return;
    }
    onChange?.([...value, id]);
  }

  return (
    <section className="fa-captcha-image-select" aria-label="图片点选验证码">
      <p className="fa-captcha-image-select__instruction">{instruction}</p>
      <div className="fa-captcha-image-select__items">
        {items.map((item) => {
          const selected = value.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.alt}
              aria-pressed={selected}
              className={'fa-captcha-image-select__item' + (selected ? ' is-selected' : '')}
              disabled={disabled}
              onClick={() => toggleItem(item.id)}
            >
              <span aria-hidden="true">{item.content}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
