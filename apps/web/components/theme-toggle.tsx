'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@hanul/ui/components/dropdown-menu';
import { Button } from '@hanul/ui/components/button';
import { Monitor, Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { setTheme } = useTheme();
  const t = useTranslations('Nav');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={t('theme')}
          title={t('theme')}
        >
          <span className="relative inline-flex size-4 items-center justify-center">
            <Sun
              aria-hidden
              className="size-4 rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0"
            />
            <Moon
              aria-hidden
              className="absolute size-4 rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100"
            />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="size-4" />
          <span className="ml-2">{t('system')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="size-4" />
          <span className="ml-2">{t('light')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="size-4" />
          <span className="ml-2">{t('dark')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
