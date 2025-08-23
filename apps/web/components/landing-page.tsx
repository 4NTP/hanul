'use client';

import { Button } from '@hanul/ui/components/button';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function LandingPage() {
  const t = useTranslations('Landing');

  return (
    <section className="relative overflow-hidden">
      {/* Backdrop: animated gradient and grid pattern */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 animate-gradient-x bg-[radial-gradient(1200px_500px_at_50%_-20%,hsl(var(--primary)/.08),transparent_60%),linear-gradient(90deg,hsl(var(--accent)/.12),transparent,hsl(var(--accent)/.12))]" />
        <div className="absolute inset-0 grid-pattern opacity-[.22]" />
        {/* Gradient mesh */}
        <div className="mesh">
          <span className="m1" />
          <span className="m2" />
          <span className="m3" />
          <span className="m4" />
        </div>
        {/* New aurora and twinkles layers */}
        <div className="aurora">
          <span className="a1" />
          <span className="a2" />
          <span className="a3" />
          <span className="a4" />
        </div>
        <div className="twinkles" />
        <div className="vignette" />
      </div>

      {/* Hero */}
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:gap-8 sm:py-28">
        <span className="inline-flex animate-fade-in-up items-center gap-2 rounded-full border px-3 py-1 text-xs text-foreground/70 backdrop-blur">
          <span className="size-1.5 rounded-full bg-primary" />
          {t('badge')}
        </span>
        <h1 className="animate-fade-in-up text-balance text-4xl font-bold tracking-tight md:text-6xl">
          {t('headline')}
        </h1>
        <p className="animate-fade-in-up text-balance text-foreground/70 md:text-lg max-w-3xl">
          {t('philosophyLead')}
        </p>
        <div className="animate-fade-in-up flex items-center gap-3">
          <Button asChild>
            <Link href="/signin">{t('ctaPrimary')}</Link>
          </Button>
          {/* <Button asChild variant="ghost">
            <Link href="/">{t('ctaSecondary')}</Link>
          </Button> */}
        </div>

        {/* Marquee of values */}
        <div className="marquee mt-10 w-full">
          <div className="marquee-track text-xs text-muted-foreground">
            <span className="mx-6">{t('humanFocusTitle')}</span>
            <span className="mx-6">{t('mainAgentTitle')}</span>
            <span className="mx-6">{t('subAgentsTitle')}</span>
            <span className="mx-6">{t('flowIntent')}</span>
            <span className="mx-6">{t('flowOrchestrate')}</span>
            <span className="mx-6">{t('flowRefine')}</span>
            <span className="mx-6">{t('flowDeliver')}</span>
            <span className="mx-6">{t('humanFocusTitle')}</span>
            <span className="mx-6">{t('mainAgentTitle')}</span>
            <span className="mx-6">{t('subAgentsTitle')}</span>
            <span className="mx-6">{t('flowIntent')}</span>
            <span className="mx-6">{t('flowOrchestrate')}</span>
            <span className="mx-6">{t('flowRefine')}</span>
            <span className="mx-6">{t('flowDeliver')}</span>
          </div>
        </div>

        {/* Philosophy: premium cards */}
        <div className="mt-14 grid w-full max-w-6xl grid-cols-1 gap-5 px-2 sm:grid-cols-3">
          <div className="card-shine tilt-on-hover rounded-2xl border bg-card/80 p-6 text-left shadow-sm backdrop-blur">
            <div className="mb-3 inline-flex size-9 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
              1
            </div>
            <div className="mb-1 text-sm font-semibold">
              {t('humanFocusTitle')}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('humanFocusDesc')}
            </div>
          </div>
          <div className="card-shine tilt-on-hover rounded-2xl border bg-card/80 p-6 text-left shadow-sm backdrop-blur delay-100">
            <div className="mb-3 inline-flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              2
            </div>
            <div className="mb-1 text-sm font-semibold">
              {t('mainAgentTitle')}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('mainAgentDesc')}
            </div>
          </div>
          <div className="card-shine tilt-on-hover rounded-2xl border bg-card/80 p-6 text-left shadow-sm backdrop-blur delay-200">
            <div className="mb-3 inline-flex size-9 items-center justify-center rounded-md bg-sky-500/10 text-sky-600">
              3
            </div>
            <div className="mb-1 text-sm font-semibold">
              {t('subAgentsTitle')}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('subAgentsDesc')}
            </div>
          </div>
        </div>

        {/* Manifesto section */}
        <div className="mt-20 w-full max-w-3xl text-left">
          <div className="mb-2 text-center text-sm font-semibold">
            {t('manifestoTitle')}
          </div>
          <p className="mx-auto mb-8 max-w-2xl text-center text-xs text-muted-foreground">
            {t('manifestoLead')}
          </p>
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">{t('manifesto1')}</p>
            <p className="text-sm text-muted-foreground">{t('manifesto2')}</p>
            <p className="text-sm text-muted-foreground">{t('manifesto3')}</p>
          </div>
          <div className="mt-8 rounded-2xl border bg-card/70 p-6 shadow-sm backdrop-blur">
            <p className="text-sm italic md:text-base">
              “{t('manifestoQuote')}”
            </p>
            <div className="mt-3 text-xs text-muted-foreground">
              — {t('manifestoAuthor')}
            </div>
          </div>
        </div>

        {/* Example section: prompt refine journey */}
        <div className="mt-20 w-full max-w-6xl px-4">
          <div className="mb-4 text-center text-sm font-semibold">
            {t('exampleTitle')}
          </div>
          <p className="mx-auto mb-6 max-w-2xl text-center text-xs text-muted-foreground">
            {t('exampleLead')}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-2 text-xs font-semibold text-muted-foreground">
                {t('exampleRawPrompt')}
              </div>
              <pre className="hljs text-xs">{t('exampleRawContent')}</pre>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-2 text-xs font-semibold text-muted-foreground">
                {t('exampleRefinedPrompt')}
              </div>
              <pre className="hljs text-xs">{t('exampleRefinedContent')}</pre>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-2 text-xs font-semibold text-muted-foreground">
                {t('exampleResult')}
              </div>
              <pre className="hljs text-xs">{t('exampleResultContent')}</pre>
            </div>
          </div>
        </div>

        {/* Stats removed per request */}

        {/* CTA banner */}
        <div className="mt-16 w-full max-w-4xl overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-sky-500/10 to-transparent p-[1px]">
          <div className="rounded-2xl bg-background px-6 py-6 sm:px-10 sm:py-8">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <div className="text-left">
                <div className="text-sm font-semibold">
                  {t('ctaBannerTitle')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('ctaBannerDesc')}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button asChild size="sm">
                  <Link href="/signin">{t('ctaPrimary')}</Link>
                </Button>
                {/* <Button asChild size="sm" variant="outline">
                  <Link href="/signup">{t('ctaSecondary')}</Link>
                </Button> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
