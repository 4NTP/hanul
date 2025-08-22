'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@hanul/ui/components/button';
import { Link } from '@/i18n/navigation';

function providerUrl(provider: 'google' | 'x' | 'apple') {
  const base = process.env.NEXT_PUBLIC_SERVER_URL;
  const map = {
    google: `${base}/auth/google`,
    x: `${base}/auth/x`,
    apple: `${base}/auth/apple`,
  } as const;
  return map[provider];
}

export default function SignInPage() {
  const t = useTranslations('Auth');

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-stretch justify-center gap-3 px-4 py-16">
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold">{t('signInTitle')}</h1>
        <p className="text-sm text-foreground/70">{t('signInSub')}</p>
      </div>
      <Button asChild size="lg">
        <a href={providerUrl('google')} className="w-full">
          {t('withGoogle')}
        </a>
      </Button>
      <Button asChild size="lg" variant="outline">
        <a href={providerUrl('x')} className="w-full">
          {t('withX')}
        </a>
      </Button>
      <Button asChild size="lg" variant="outline">
        <a href={providerUrl('apple')} className="w-full">
          {t('withApple')}
        </a>
      </Button>
      <p className="mt-6 text-center text-xs text-foreground/60">
        {t('termsHint')}
      </p>
      <div className="mt-2 text-center text-sm text-foreground/80">
        {t('noAccount')}{' '}
        <Link
          href="/signup"
          className="text-primary underline-offset-4 hover:underline"
        >
          {t('signUpLink')}
        </Link>
      </div>
    </div>
  );
}
