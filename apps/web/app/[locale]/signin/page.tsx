'use client';

import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@hanul/ui/components/button';
import { Input } from '@hanul/ui/components/input';
import { Label } from '@hanul/ui/components/label';
import { Form, FormField, FormMessage } from '@hanul/ui/components/form';
import { Link } from '@/i18n/navigation';
import { authAPI, type SignInRequest } from '@/lib/api/auth';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';

export default function SignInPage() {
  const t = useTranslations('Auth');
  const { signIn } = useAuth();
  const router = useRouter();

  const signInMutation = useMutation({
    mutationFn: (data: SignInRequest) => authAPI.signIn(data),
    onSuccess: (response) => {
      signIn(response.data.accessToken, response.data.refreshToken);
      router.push('/');
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    signInMutation.mutate({ email, password });
  };

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-stretch justify-center gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('signInTitle')}</h1>
        <p className="text-sm text-foreground/70">{t('signInSub')}</p>
      </div>

      <Form onSubmit={handleSubmit}>
        <FormField>
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t('emailPlaceholder')}
            required
            disabled={signInMutation.isPending}
          />
        </FormField>

        <FormField>
          <Label htmlFor="password">{t('password')}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={t('passwordPlaceholder')}
            required
            disabled={signInMutation.isPending}
          />
        </FormField>

        {signInMutation.error && (
          <FormMessage>
            {signInMutation.error.message || t('signInError')}
          </FormMessage>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={signInMutation.isPending}
        >
          {signInMutation.isPending ? t('signingIn') : t('signIn')}
        </Button>
      </Form>

      <p className="text-center text-xs text-foreground/60">{t('termsHint')}</p>

      <div className="text-center text-sm text-foreground/80">
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
