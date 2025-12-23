import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/client";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/useToast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Printer,
  CheckCircle2,
  Package,
  FileText,
  Shield
} from "lucide-react";

// Logo Component with animation
const Logo = ({ className, light = false }: { className?: string; light?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className={`inline-flex items-center gap-3 ${className}`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${light ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
      <Printer className="w-6 h-6" strokeWidth={2.5} />
    </div>
    <div className="text-left">
      <h1 className={`text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-slate-900 dark:text-white'}`}>PrintPortal</h1>
      <p className={`text-xs ${light ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>Customer Portal</p>
    </div>
  </motion.div>
);

export default function CustomerAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/customer-portal");
      }
    };
    checkUser();
  }, [navigate]);

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
      transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
  };

  const fadeTransition = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      navigate("/customer-portal");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Sign in failed. Please try again.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const redirectUrl = `${window.location.origin}/customer-portal`;
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            phone,
            address,
          }
        }
      });

      if (signUpError) throw signUpError;

      // Create customer profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from("customers")
          .insert({
            user_id: data.user.id,
            name,
            email,
            phone,
            address,
            joined_date: new Date().toISOString().split('T')[0]
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          throw new Error("Failed to create customer profile. Please contact support.");
        }
      }

      toast({
        title: "Account Created Successfully!",
        description: "Please check your email to verify your account.",
      });
      
      // Switch to sign in view after successful signup
      setIsSignUp(false);
      setPassword("");
      setError("Account created! Please sign in.");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Sign up failed. Please try again.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Hero Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/login-bg.png')`,
          }}
        />
        
        {/* Light Gradient Overlay - Clean & Modern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-blue-600/70 to-blue-500/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-blue-700/80 via-transparent to-blue-600/30"></div>

        <div className="relative z-10 w-full p-12 lg:p-16 flex flex-col justify-between h-full text-white">
          <Logo light className="drop-shadow-md" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="space-y-8"
          >
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight max-w-lg drop-shadow-md">
              Your Print Orders, <br /> <span className="text-white/90">Simplified.</span>
            </h2>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.2 } }
              }}
              className="space-y-4 pt-4 border-t border-white/30"
            >
              {[
                { icon: Package, text: "Track Orders in Real-time" },
                { icon: FileText, text: "Access Invoices Instantly" },
                { icon: Shield, text: "Secure Customer Portal" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 }
                  }}
                  className="flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-sm">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-medium text-white drop-shadow-sm">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex items-center gap-4 text-sm text-white/80 font-medium"
          >
            <span>© 2024 Classic Offset</span>
            <span className="w-1 h-1 bg-white/50 rounded-full"></span>
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
          className="w-full max-w-md space-y-8"
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
                  {isSignUp ? 'Create your account' : 'Welcome back'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  {isSignUp ? 'Join PrintPortal to track your orders' : 'Enter your details to access your orders'}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.form
                key={isSignUp ? "signup-form" : "login-form"}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20 }}
                onSubmit={isSignUp ? handleSignUp : handleSignIn}
                className="space-y-4"
              >
                {/* Sign Up Fields */}
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Full Name
                      </Label>
                      <div className="relative group">
                        <User className="w-5 h-5 text-slate-400 absolute top-3 left-3 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                        <Input
                          type="text"
                          required
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 
                          rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400
                          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                          transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Phone Number
                      </Label>
                      <div className="relative group">
                        <Phone className="w-5 h-5 text-slate-400 absolute top-3 left-3 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                        <Input
                          type="tel"
                          required
                          placeholder="Enter your phone number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 
                          rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400
                          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                          transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Address
                      </Label>
                      <div className="relative group">
                        <MapPin className="w-5 h-5 text-slate-400 absolute top-3 left-3 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                        <Input
                          type="text"
                          required
                          placeholder="Enter your address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 
                          rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400
                          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                          transition-all"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Email Field */}
                <div className="space-y-1.5">
                  <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email address
                  </Label>
                  <div className="relative group">
                    <Mail className="w-5 h-5 text-slate-400 absolute top-3 left-3 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                    <Input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 
                      rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400
                      focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                      transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                  <div className="relative group">
                    <Lock className="w-5 h-5 text-slate-400 absolute top-3 left-3 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 
                      rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400
                      focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
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

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-2 p-3 text-sm rounded-lg ${
                      error.includes("created") 
                        ? "text-green-600 bg-green-50 dark:bg-green-950/30" 
                        : "text-red-600 bg-red-50 dark:bg-red-950/30"
                    }`}
                  >
                    {error.includes("created") ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700
                    text-white font-semibold rounded-lg shadow-md hover:shadow-lg
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
                  </Button>
                </motion.div>
              </motion.form>
            </AnimatePresence>

            {/* Toggle Sign In / Sign Up */}
            <motion.p variants={itemVariants} className="text-center text-sm text-slate-500 dark:text-slate-400">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline underline-offset-4 transition-all"
                onClick={() => { setIsSignUp((v) => !v); setError(''); }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}