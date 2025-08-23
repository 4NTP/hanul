'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@hanul/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@hanul/ui/components/dropdown-menu';
import Image from 'next/image';
import ThemeToggle from '@/components/theme-toggle';
import LocaleSwitcher from '@/components/locale-switcher';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export default function Navbar() {
  const t = useTranslations('Nav');
  const { user, isAuthenticated, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-4">
        <Link href="/">
          {theme === 'light' ? (
            <Image
              src="/logo.svg"
              alt="Logo"
              width={108}
              height={32}
              className="inline-block"
            />
          ) : (
            <Image
              src="/logo-dark.svg"
              alt="Logo"
              width={108}
              height={32}
              className="inline-block"
            />
          )}
        </Link>
        <nav className="flex items-center gap-2">
          {/* Desktop controls */}
          <div className="hidden sm:flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
            {isAuthenticated && user ? (
              <>
                <span className="text-sm text-foreground/70">{user.name}</span>
                <Button size="sm" variant="ghost" onClick={signOut}>
                  {t('signOut')}
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/signin">{t('signIn')}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">{t('signUp')}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile dropdown */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  ⋮
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    {t('language')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {routing.locales.map((loc) => (
                      <DropdownMenuItem
                        key={loc}
                        onClick={() =>
                          router.replace({ pathname }, { locale: loc })
                        }
                      >
                        <span className="mr-2">
                          {loc === 'ko' ? '🇰🇷' : '🇺🇸'}
                        </span>
                        {loc === 'en' ? t('locale.en') : t('locale.ko')}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>{t('theme')}</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme('system')}>
                      {t('system')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('light')}>
                      {t('light')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')}>
                      {t('dark')}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                {isAuthenticated && user ? (
                  <DropdownMenuItem asChild>
                    <button onClick={signOut}>{t('signOut')}</button>
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/signin">{t('signIn')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/signup">{t('signUp')}</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </div>
    </header>
  );
}
