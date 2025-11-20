import { Turnstile as TurnstileWidget } from '@marsidev/react-turnstile';

interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
}

export function Turnstile({ onSuccess, onError }: TurnstileProps) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAACCGX1BRYFulfvqU';

  return (
    <div className="flex justify-center my-4">
      <TurnstileWidget
        siteKey={siteKey}
        onSuccess={onSuccess}
        onError={onError}
      />
    </div>
  );
}
