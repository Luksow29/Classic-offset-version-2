// @ts-nocheck
import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { Loader2, Lock, Key, Shield, Eye, EyeOff, LogOut, Smartphone, Check, AlertTriangle, RefreshCw, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/context/SettingsContext';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';

const SecuritySettings: React.FC = () => {
  const { user } = useUser();
  const { settings, updateSettings } = useSettings();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 2FA State
  const [factors, setFactors] = useState<any[]>([]);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  useEffect(() => {
    fetchFactors();
  }, [user]);

  const fetchFactors = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors(data?.all?.filter(f => f.factor_type === 'totp' && f.status === 'verified') || []);
    } catch (err) {
      console.error('Error fetching MFA factors:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.currentPassword,
      });

      if (signInError) throw new Error('Current password is incorrect');

      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAllSessions = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      toast.success('Logged out of all devices');
      navigate('/login');
    } catch (error: any) {
      console.error('Error logging out:', error);
      toast.error(error.message || 'Failed to log out');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollTwoFactor = async () => {
    if (show2FASetup) { setShow2FASetup(false); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;

      setFactorId(data.id);
      setSecret(data.totp.secret);
      const qrUrl = await QRCode.toDataURL(data.totp.uri);
      setQrCodeUrl(qrUrl);
      setShow2FASetup(true);
    } catch (err: any) {
      console.error('Error enrolling 2FA:', err);
      toast.error(err.message || 'Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTwoFactor = async () => {
    if (!verifyCode || !factorId) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: verifyCode });
      if (error) throw error;

      toast.success('Two-factor authentication enabled!');
      setShow2FASetup(false);
      setVerifyCode('');
      fetchFactors();
      await updateSettings({
        security_preferences: { ...settings?.security_preferences, two_factor_enabled: true }
      });
    } catch (err: any) {
      console.error('Error verifying 2FA:', err);
      toast.error(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (factors.length === 0) return;
    if (!window.confirm('Disable Two-Factor Authentication? Account security will be reduced.')) return;

    setLoading(true);
    try {
      for (const factor of factors) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (error) throw error;
      }

      toast.success('Two-factor authentication disabled');
      fetchFactors();
      await updateSettings({
        security_preferences: { ...settings?.security_preferences, two_factor_enabled: false }
      });
    } catch (err: any) {
      console.error('Error disabling 2FA:', err);
      toast.error('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const is2FAEnabled = factors.length > 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  // Helper for custom labels
  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-xs font-semibold text-foreground ml-1 mb-1">{children}</label>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 max-w-4xl pt-1" // Reduced space-y and padding top
    >
      {/* 2FA Section - Refined Compact */}
      <motion.div variants={itemVariants} className="space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <Shield className="w-3 h-3 text-primary" />
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Two-Factor Auth</h3>
        </div>

        <div className="bg-card border border-border rounded-lg p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-full ${is2FAEnabled ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'}`}>
                {is2FAEnabled ? <Check className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">2FA is {is2FAEnabled ? 'On' : 'Off'}</p>
                  {is2FAEnabled && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-px rounded-full font-medium border border-green-200">Active</span>}
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {is2FAEnabled ? 'Account secured.' : 'Add extra security.'}
                </p>
              </div>
            </div>
            {!show2FASetup && (
              <Button
                size="sm"
                variant={is2FAEnabled ? "destructive" : "outline"}
                onClick={is2FAEnabled ? handleDisableTwoFactor : handleEnrollTwoFactor}
                disabled={loading}
                className="h-7 text-xs px-3 shadow-sm"
              >
                {is2FAEnabled ? 'Disable' : 'Enable'}
              </Button>
            )}
          </div>

          <AnimatePresence>
            {show2FASetup && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-border grid grid-cols-[auto_1fr] gap-4">
                  <div className="bg-white p-1.5 rounded border flex items-center justify-center">
                    {qrCodeUrl && <img src={qrCodeUrl} alt="QR" className="w-20 h-20" />}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Verify Code</p>
                      <Input
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="h-8 text-center tracking-widest font-mono text-sm w-32"
                        label=""
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleVerifyTwoFactor} size="sm" className="h-7 text-xs px-3" disabled={loading || verifyCode.length !== 6}>
                        Verify
                      </Button>
                      <Button variant="ghost" onClick={() => setShow2FASetup(false)} size="sm" className="h-7 text-xs px-2">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Password Change Section - Refined Compact */}
      <motion.div variants={itemVariants} className="space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <Lock className="w-3 h-3 text-primary" />
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</h3>
        </div>

        <form onSubmit={handleChangePassword} className="bg-card border border-border rounded-xl p-3 md:p-4 space-y-3">
          <div className="space-y-1">
            <FieldLabel>Current Password</FieldLabel>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={handleChange}
                className="h-9 px-3 text-sm pr-9"
                placeholder="••••••••"
                label=""
              />
              <button
                type="button"
                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <FieldLabel>New Password</FieldLabel>
            <Input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={handleChange}
              className="h-9 px-3 text-sm"
              placeholder="Min 8 chars"
              label=""
            />
          </div>

          <div className="space-y-1">
            <FieldLabel>Confirm Password</FieldLabel>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="h-9 px-3 text-sm"
              placeholder="Re-enter new"
              label=""
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" size="sm" disabled={loading} className="h-8 text-xs shadow-sm w-full md:w-auto">
              {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
              Update Password
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Sessions Section - Refined Compact */}
      <motion.div variants={itemVariants} className="space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <Smartphone className="w-3 h-3 text-primary" />
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Session</h3>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-2.5 flex items-center justify-between bg-muted/10">
            <div className="flex items-center gap-2.5">
              <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full text-green-600">
                <RefreshCw className="w-3 h-3" />
              </div>
              <div>
                <p className="text-xs font-semibold">Current Device</p>
                <p className="text-[10px] text-muted-foreground line-clamp-1 opacity-80">{navigator.userAgent.split(')')[0]})</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogoutAllSessions} disabled={loading}>
              <LogOut className="w-3 h-3 mr-1" />
              Logout Others
            </Button>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
};

export default SecuritySettings;