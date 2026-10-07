import TextImageCaptcha from './TextImageCaptcha';

export interface ArithmeticCaptchaProps {
  id?: string;
  imageUrl: string;
  size?: 'large' | 'middle' | 'small';
  value?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onRefresh?: () => void;
}

/**
 * 展示调用方生成的算术题图片，并收集用户答案。
 */
export default function ArithmeticCaptcha({ id, imageUrl, size = 'middle', value = '', disabled = false, onChange, onRefresh }: ArithmeticCaptchaProps) {
  return (
    <TextImageCaptcha
      id={id}
      imageAlt="算术验证码题目"
      imageUrl={imageUrl}
      imageWidth={180}
      inputAriaLabel="算术验证码答案"
      inputMode="numeric"
      maxLength={3}
      onChange={onChange}
      onRefresh={onRefresh}
      placeholder="请输入算式结果"
      refreshAriaLabel="刷新算术验证码"
      refreshTitle="换一题"
      size={size}
      value={value}
      disabled={disabled}
    />
  );
}
