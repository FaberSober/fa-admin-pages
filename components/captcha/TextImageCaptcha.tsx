import { ReloadOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import './captcha.scss';

export interface TextImageCaptchaProps {
  id?: string;
  imageUrl: string;
  imageAlt?: string;
  inputAriaLabel?: string;
  inputMode?: 'text' | 'numeric';
  refreshAriaLabel?: string;
  refreshTitle?: string;
  size?: 'large' | 'middle' | 'small';
  value?: string;
  placeholder?: string;
  maxLength?: number;
  imageWidth?: number;
  imageHeight?: number;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onRefresh?: () => void;
}

/**
 * 展示服务端或调用方提供的字符验证码图片，并收集用户输入。
 * 验证码生成、刷新和校验由调用方负责。
 */
export default function TextImageCaptcha({
  id,
  imageUrl,
  imageAlt = '图形验证码',
  inputAriaLabel = '图形验证码',
  inputMode = 'text',
  refreshAriaLabel = '刷新图形验证码',
  refreshTitle = '换一张',
  size = 'middle',
  value = '',
  placeholder = '请输入图形验证码',
  maxLength = 8,
  imageWidth = 132,
  imageHeight,
  disabled = false,
  onChange,
  onRefresh,
}: TextImageCaptchaProps) {
  const controlHeight = size === 'large' ? 40 : size === 'small' ? 24 : 32;
  return (
    <div className="fa-captcha-text-image">
      <Input
        aria-label={inputAriaLabel}
        autoComplete="off"
        disabled={disabled}
        id={id}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        size={size}
        value={value}
      />
      <img
        className="fa-captcha-text-image__image"
        src={imageUrl}
        alt={imageAlt}
        style={{ width: imageWidth, height: imageHeight ?? controlHeight, flexBasis: imageWidth }}
      />
      {onRefresh && <Button aria-label={refreshAriaLabel} disabled={disabled} icon={<ReloadOutlined />} onClick={onRefresh} size={size} title={refreshTitle} />}
    </div>
  );
}
