'use client';

import { useLocale, useTranslations } from 'next-intl';
import { routing } from '@/i18n/routing';
import { usePathname, useRouter } from '@/i18n/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@hanul/ui/components/dropdown-menu';
import { Button } from '@hanul/ui/components/button';

export default function LocaleSwitcher() {
  const t = useTranslations('Nav');
  const router = useRouter();
  const pathname = usePathname();
  const activeLocale = useLocale();

  const flagFor = (loc: string) => (loc === 'ko' ? '🇰🇷' : '🇺🇸');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={t('language')}
          title={t('language')}
        >
          <span aria-hidden className="text-lg leading-none">
            {flagFor(activeLocale)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => router.replace({ pathname }, { locale: loc })}
          >
            <span aria-hidden className="text-lg leading-none">
              {flagFor(loc)}
            </span>
            <span className="ml-2">
              {loc === 'en' ? t('locale.en') : t('locale.ko')}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
