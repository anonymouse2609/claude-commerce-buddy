import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/use-toast';

type FormValues = {
  email: string;
  password: string;
};

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const form = useForm<FormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [loading, user, navigate]);

  const onSubmit = async (values: FormValues) => {
    const action = mode === 'login' ? signIn : signUp;
    const { error } = await action(values.email, values.password);
    if (error) {
      toast({ title: 'Something went wrong', description: error, variant: 'destructive' });
      return;
    }

    toast({
      title: mode === 'login' ? 'Welcome back!' : 'Account created!',
      description: 'Your data is now synced securely.',
    });

    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">{mode === 'login' ? 'Sign in' : 'Create an account'}</h1>
          <p className="text-sm text-muted-foreground">Use your email and password to access your study data from any device.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" type="password" {...field} />
                  </FormControl>
                  <FormDescription>At least 6 characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        </Form>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button
            type="button"
            className="text-primary underline-offset-4 hover:underline"
            onClick={() => setMode(prev => (prev === 'login' ? 'signup' : 'login'))}
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
