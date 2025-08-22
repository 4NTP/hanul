'use client';

import { Button } from '@hanul/ui/components/button';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function LandingPage() {
  const t = useTranslations('Landing');

  return (
    <section className="relative">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-20 text-center">
        <span className="inline-flex animate-fade-in-up items-center gap-2 rounded-full border px-3 py-1 text-xs text-foreground/70">
          <span className="size-1.5 rounded-full bg-primary" />
          {t('badge')}
        </span>
        <h1 className="animate-fade-in-up text-balance text-4xl font-bold tracking-tight md:text-6xl">
          {t('headline')}
        </h1>
        <p className="animate-fade-in-up text-balance text-foreground/70 md:text-lg">
          {t('subhead')}
        </p>
        <div className="animate-fade-in-up flex items-center gap-3">
          <Button asChild>
            <Link href="/signin">{t('ctaPrimary')}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">{t('ctaSecondary')}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
