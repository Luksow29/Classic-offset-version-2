import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, KeyRound } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setHasSession(Boolean(data.session));
      setSessionReady(true);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setHasSession(Boolean(session));
      setSessionReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const canSubmit = useMemo(() => {
    if (!sessionReady || !hasSession) return false;
    if (isSubmitting) return false;
    if (password.length < 8) return false;
    if (password !== confirmPassword) return false;
    return true;
  }, [sessionReady, hasSession, isSubmitting, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      toast.success('Password updated. Please sign in again.');
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>

        <Card className="p-6">
          <h1 className="text-2xl font-bold text-foreground">Reset password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set a new password for your account.
          </p>

          {!sessionReady ? (
            <div className="mt-6 text-sm text-muted-foreground">Preparing reset session…</div>
          ) : !hasSession ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-destructive">
                This reset link is invalid or expired. Please request a new one.
              </p>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password (min 8 characters)"
                autoComplete="new-password"
                icon={<KeyRound className="h-4 w-4" />}
                disabled={isSubmitting}
                required
              />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                icon={<KeyRound className="h-4 w-4" />}
                disabled={isSubmitting}
                required
              />
              <Button type="submit" disabled={!canSubmit} className="w-full">
                {isSubmitting ? 'Updating…' : 'Update password'}
              </Button>
              {password && password.length < 8 ? (
                <p className="text-xs text-muted-foreground">Password must be at least 8 characters.</p>
              ) : null}
              {confirmPassword && password !== confirmPassword ? (
                <p className="text-xs text-muted-foreground">Passwords do not match.</p>
              ) : null}
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
