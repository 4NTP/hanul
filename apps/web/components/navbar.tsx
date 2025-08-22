import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@hanul/ui/components/button';
import ThemeToggle from '@/components/theme-toggle';
import LocaleSwitcher from '@/components/locale-switcher';

export default function Navbar() {
  const t = useTranslations('Nav');

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          {t('brand')}
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="text-sm text-foreground/80 hover:text-foreground"
          >
            {t('home')}
          </Link>
          <LocaleSwitcher />
          <ThemeToggle />
          <Button asChild size="sm" variant="outline">
            <Link href="/signin">{t('signIn')}</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
