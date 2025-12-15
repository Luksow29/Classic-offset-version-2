import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => !isSubmitting && email.trim().length > 0, [email, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;

      toast.success('Password reset link sent. Check your email.');
      navigate('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send password reset email';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>

        <Card className="p-6">
          <h1 className="text-2xl font-bold text-foreground">Forgot password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email and we’ll send a reset link.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              icon={<Mail className="h-4 w-4" />}
              disabled={isSubmitting}
              required
            />
            <Button type="submit" disabled={!canSubmit} className="w-full">
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  Sending…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Send reset link <Send className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
