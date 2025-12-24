import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SafeImage from '../../ui/SafeImage';

import { Loader2, Mail, Lock, AlertTriangle, Printer, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const Logo = ({ className, light = false }: { className?: string, light?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className={`inline-flex items-center gap-3 ${className}`}
  >
    <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden bg-white shadow-sm`}>
      <SafeImage src="/classic-offset-logo.jpg" alt="Logo" className="w-full h-full object-cover" priority={true} />
    </div>
    <div className="text-left">
      <h1 className={`text-2xl font-bold tracking-tight ${light ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Classic Offset</h1>
    </div>
  </motion.div>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 2FA State
  const [showMFA, setShowMFA] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');

  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) throw signInError;

      if (data.user) {
        // Check for MFA factors
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

        if (factorsError) throw factorsError;

        const verifiedFactors = factorsData.all.filter(f => f.status === 'verified' && f.factor_type === 'totp');

        if (verifiedFactors.length > 0) {
          // User has 2FA enabled, show MFA input
          setMfaFactorId(verifiedFactors[0].id);
          setShowMFA(true);
          setLoading(false);
          return; // Stop here, wait for MFA code
        }
      }

      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      // Only stop loading if we are NOT showing MFA (if showing MFA, we keep loading 'false' so UI is interactive? actually we set loading false above)
      if (!showMFA) setLoading(false);
    }
  };

  const handleMFAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfaFactorId,
        code: mfaCode
      });

      if (error) throw error;

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid code');
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) setError(signUpError.message);
    else {
      setIsSignUp(false);
      setError('Sign up successful! Please sign in.');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
      // Note: User will be redirected to Google, so we don't need to navigate manually here
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google sign-in.');
      setGoogleLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const fadeTransition = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Hero Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        {/* Unsplash Image - Printing/Industrial Vibe */}
        <motion.div
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/login-bg.jpg')`
          }}
        />
        {/* Gradient Overlay for Text Readability - Darker relative to text position */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-transparent"></div>

        <div className="relative z-10 w-full p-16 flex flex-col justify-between h-full text-white">
          <Logo light className="drop-shadow-md" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="space-y-8 drop-shadow-md"
          >
            <h2 className="text-5xl font-bold leading-tight tracking-tight max-w-lg">
              Precision in <br /> <span className="text-slate-200">Every Print.</span>
            </h2>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.2 } }
              }}
              className="space-y-4 pt-4 border-t border-white/10"
            >
              {[
                "Premium Offset Quality",
                "Real-time Order Tracking",
                "Seamless Inventory Management"
              ].map((text, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 }
                  }}
                  className="flex items-center gap-4"
                >
                  <CheckCircle2 className="w-5 h-5 text-white/80" />
                  <span className="text-lg text-white/80">{text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex items-center gap-4 text-sm text-slate-400"
          >
            <span>© 2024 Classic Offset</span>
            <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
            <span>All rights reserved</span>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-950">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm space-y-8"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Logo className="justify-center" />
          </div>

          <motion.div variants={itemVariants} className="space-y-2 text-center lg:text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={isSignUp ? "signup-header" : "login-header"}
                {...fadeTransition}
              >
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {showMFA ? 'Two-Factor Authentication' : (isSignUp ? 'Create your account' : 'Welcome back')}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  {showMFA ? 'Enter the code from your authenticator app' : (isSignUp ? 'Start managing your printing business' : 'Enter your details to access your dashboard')}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {showMFA ? (
            <form onSubmit={handleMFAVerify} className="space-y-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Authentication Code
                </label>
                <div className="relative group">
                  <ShieldCheck className="w-5 h-5 text-slate-400 absolute top-3 left-3 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" />
                  <input
                    type="text"
                    required
                    placeholder="000000"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 
                            rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 font-mono tracking-widest text-center text-lg
                            focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-white
                            transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100
                      text-white dark:text-slate-900 font-semibold rounded-lg shadow-md hover:shadow-lg
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-white
                      disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Verify'}
              </motion.button>
            </form>
          ) : (
            <div className="space-y-6">
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 
              bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 
              rounded-lg text-slate-700 dark:text-slate-200 font-medium
              hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700
              focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-800
              disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853" // Green
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      className="fill-green-600"
                    />
                    <path
                      fill="#FBBC05" // Yellow
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      className="fill-amber-500"
                    />
                    <path
                      fill="#EA4335" // Red
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      className="fill-red-500"
                    />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                )}
                <span>Continue with Google</span>
              </motion.button>

              <motion.div variants={itemVariants} className="relative flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Or {isSignUp ? 'signup' : 'login'} with email</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.form
                  key={isSignUp ? "signup-form" : "login-form"}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -20 }}
                  onSubmit={isSignUp ? handleEmailSignUp : handleEmailLogin}
                  className="space-y-4"
                >
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Email address
                      </label>
                      <div className="relative group">
                        <Mail className="w-5 h-5 text-slate-400 absolute top-3 left-3 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" />
                        <input
                          type="email"
                          required
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 
                        rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400
                        focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-white
                        transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Password
                        </label>
                        {!isSignUp && (
                          <Link to="/forgot-password" className="text-sm font-medium text-slate-900 dark:text-white hover:underline decoration-slate-300 underline-offset-4">
                            Forgot password?
                          </Link>
                        )}
                      </div>
                      <div className="relative group">
                        <Lock className="w-5 h-5 text-slate-400 absolute top-3 left-3 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-12 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 
                        rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400
                        focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-white
                        transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isSignUp && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1.5 overflow-hidden"
                      >
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Confirm Password
                        </label>
                        <div className="relative group">
                          <Lock className="w-5 h-5 text-slate-400 absolute top-3 left-3 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-10 pr-12 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 
                          rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400
                          focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-white
                          transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg"
                    >
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full py-2.5 px-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100
                  text-white dark:text-slate-900 font-semibold rounded-lg shadow-md hover:shadow-lg
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-white
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : (isSignUp ? 'Create account' : 'Sign in')}
                  </motion.button>
                </motion.form>
              </AnimatePresence>

              <motion.p variants={itemVariants} className="text-center text-sm text-slate-500 dark:text-slate-400">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <button
                  type="button"
                  className="font-semibold text-slate-900 dark:text-white hover:underline underline-offset-4 transition-all"
                  onClick={() => { setIsSignUp((v) => !v); setError(''); }}
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </motion.p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
