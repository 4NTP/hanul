'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@hanul/ui/components/button';
import Image from 'next/image';
import ThemeToggle from '@/components/theme-toggle';
import LocaleSwitcher from '@/components/locale-switcher';
import { useAuth } from '@/hooks/use-auth';

export default function Navbar() {
  const t = useTranslations('Nav');
  const { user, isAuthenticated, signOut } = useAuth();

  console.log('Navbar: user:', user);
  console.log('Navbar: isAuthenticated:', isAuthenticated);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={108}
            height={32}
            className="inline-block"
          />
        </Link>
        <nav className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />

          {isAuthenticated && user ? (
            <>
              <span className="text-sm text-foreground/70">{user.name}님</span>
              <Button size="sm" variant="ghost" onClick={signOut}>
                로그아웃
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
        </nav>
      </div>
    </header>
  );
}
