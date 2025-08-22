'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@hanul/ui/components/button';
import { Input } from '@hanul/ui/components/input';
import { Label } from '@hanul/ui/components/label';
import { Form, FormField, FormMessage } from '@hanul/ui/components/form';
import { Link } from '@/i18n/navigation';
import { authAPI, type SignUpRequest } from '@/lib/api/auth';

export default function SignUpPage() {
  const t = useTranslations('Auth');
  const [error, setError] = useState('');

  const signUpMutation = useMutation({
    mutationFn: (data: SignUpRequest) => authAPI.signUp(data),
    onSuccess: () => {
      window.location.href = '/signin';
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    signUpMutation.mutate({ name, email, password });
  };

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-stretch justify-center gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('signUpTitle')}</h1>
        <p className="text-sm text-foreground/70">{t('signUpSub')}</p>
      </div>

      <Form onSubmit={handleSubmit}>
        <FormField>
          <Label htmlFor="name">{t('name')}</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder={t('namePlaceholder')}
            required
            disabled={signUpMutation.isPending}
          />
        </FormField>

        <FormField>
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t('emailPlaceholder')}
            required
            disabled={signUpMutation.isPending}
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
            disabled={signUpMutation.isPending}
            minLength={8}
          />
        </FormField>

        <FormField>
          <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder={t('confirmPasswordPlaceholder')}
            required
            disabled={signUpMutation.isPending}
            minLength={8}
          />
        </FormField>

        {(error || signUpMutation.error) && (
          <FormMessage>
            {error || signUpMutation.error?.message || t('signUpError')}
          </FormMessage>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={signUpMutation.isPending}
        >
          {signUpMutation.isPending ? t('signingUp') : t('signUp')}
        </Button>
      </Form>

      <p className="text-center text-xs text-foreground/60">{t('termsHint')}</p>

      <div className="text-center text-sm text-foreground/80">
        {t('haveAccount')}{' '}
        <Link
          href="/signin"
          className="text-primary underline-offset-4 hover:underline"
        >
          {t('signInLink')}
        </Link>
      </div>
    </div>
  );
}
