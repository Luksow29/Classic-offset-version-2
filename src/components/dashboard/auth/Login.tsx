import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { auth as firebaseAuth } from '@/lib/firebaseClient';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Correctly import individual icons from lucide-react
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Lock from 'lucide-react/dist/esm/icons/lock';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';


const Logo = ({ className }: { className?: string }) => (
  <div className={`inline-block p-3 backdrop-blur-sm bg-white/20 rounded-xl ${className}`}>
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      strokeWidth="2"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-black dark:text-white"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M4 18v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
      <path d="M8 18v-12h-2" />
      <path d="M12 18v-12" />
    </svg>
  </div>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(signInError.message);
    else navigate('/');
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      const user = result.user;
      if (!user) throw new Error("Google sign-in failed.");
      const idToken = await user.getIdToken();
      const { data, error: functionError } = await supabase.functions.invoke('firebase-auth', {
        body: { idToken },
      });
      if (functionError) throw new Error(functionError.message);
      if (!data.access_token) throw new Error(data.error || "Supabase session error.");
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sessionError) throw sessionError;
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google sign-in.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-900 md:grid md:grid-cols-2">
      <div className="hidden md:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 -mt-20 -ml-20 w-72 h-72 bg-white/10 rounded-full"></div>
        <div className="absolute bottom-0 right-0 -mb-24 -mr-12 w-96 h-96 bg-white/10 rounded-full"></div>
        <div className="z-10 text-center">
          <Logo />
          <h1 className="mt-6 text-4xl font-bold">Classic Offset</h1>
          <p className="mt-3 text-indigo-200 text-lg max-w-sm">
            Where Every Impression Counts. Manage your printing business with precision and style.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="w-full max-w-md">
          <div className="text-center md:hidden mb-8">
            <Logo />
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-black dark:text-white text-center">Sign In</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400 text-center">
              Welcome back! Please enter your details.
            </p>

            {error && (
              <div className="mt-6 flex items-center gap-3 p-3 text-sm text-center text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-8 space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="w-full inline-flex justify-center items-center py-3 px-4 
                border border-gray-300 dark:border-gray-600 rounded-lg shadow-md hover:shadow-lg 
                bg-white dark:bg-gray-700 
                text-black dark:text-white 
                hover:bg-gray-100 dark:hover:bg-gray-600 
                disabled:opacity-60 disabled:cursor-wait transition-all"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
                    <defs>
                      <path
                        id="a"
                        d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"
                      />
                    </defs>
                    <clipPath id="b">
                      <use xlinkHref="#a" overflow="visible" />
                    </clipPath>
                    <path clipPath="url(#b)" fill="#FBBC05" d="M0 37V11l17 13z" />
                    <path clipPath="url(#b)" fill="#EA4335" d="M0 11l17 13 7-6.1L48 14V0H0z" />
                    <path clipPath="url(#b)" fill="#34A853" d="M0 37l30-23 7.9 1L48 0v48H0z" />
                    <path clipPath="url(#b)" fill="#4285F4" d="M48 48L17 24l-4-3 35-10z" />
                  </svg>
                )}
                <span className="font-medium">Sign in with Google</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase">
                    Or
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="mt-6 space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-black dark:text-white mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password-login" className="block text-sm font-medium text-black dark:text-white mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
                  <input
                    id="password-login"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="text-gray-700 dark:text-gray-300">
                    Remember me
                  </label>
                </div>
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot password?
                </Link>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full flex items-center justify-center min-h-[48px] py-3 px-4 
                  bg-white dark:bg-primary-600 
                  text-black dark:text-white 
                  font-semibold rounded-lg 
                  hover:bg-gray-100 dark:hover:bg-primary-700 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 
                  disabled:opacity-60 disabled:cursor-wait 
                  transition-all duration-300 transform hover:scale-105 active:scale-95 
                  shadow-md hover:shadow-lg"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
