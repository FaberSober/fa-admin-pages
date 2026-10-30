import { useNavigate } from 'react-router-dom';
import PageException from './PageException';

export interface PageNotFoundProps {
  homePath?: string;
  onHome?: () => void;
  onBack?: () => void;
}

export default function PageNotFound({ homePath = '/', onHome, onBack }: PageNotFoundProps) {
  const navigate = useNavigate();

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(homePath, { replace: true });
    }
  }

  return (
    <PageException
      status="404"
      onPrimary={onHome ?? (() => navigate(homePath, { replace: true }))}
      onSecondary={onBack ?? handleBack}
    />
  );
}
