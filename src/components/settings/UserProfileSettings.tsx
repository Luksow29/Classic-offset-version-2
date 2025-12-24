import React, { useState, useEffect, ChangeEventHandler } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { Loader2, User, Mail, Phone, MapPin, Building, Save, X, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const UserProfileSettings: React.FC = () => {
  const { user, userProfile } = useUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    bio: '',
  });
  const [originalData, setOriginalData] = useState(formData);

  useEffect(() => {
    if (userProfile) {
      const newData = {
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        company: userProfile.company || '',
        bio: userProfile.bio || '',
      };
      setFormData(newData);
      setOriginalData(newData);
    }
  }, [userProfile]);

  const handleChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleEdit = () => setEditing(true);
  const handleCancel = () => {
    setFormData(originalData);
    setEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          address: formData.address || null,
          company: formData.company || null,
          bio: formData.bio || null,
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
      // Update the profile in any other relevant tables
      await supabase.rpc('sync_user_profile', {
        user_id: user.id,
        user_name: formData.name,
        user_phone: formData.phone || null,
        user_address: formData.address || null
      });
      setEditing(false);
      setOriginalData(formData);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 md:space-y-8 max-w-4xl"
    >
      <div className="flex items-center justify-between pb-3 md:pb-6 border-b border-border">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Profile</h2>
          <p className="text-xs md:text-base text-muted-foreground mt-0.5 md:mt-1">Manage your personal information.</p>
        </div>
        {!editing ? (
          <Button onClick={handleEdit} size="sm" variant="outline" className="h-8 md:h-10 text-xs md:text-sm">
            <Edit2 className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleCancel} size="sm" variant="ghost" className="h-8 md:h-10 text-xs md:text-sm" disabled={saving}>
              <X className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />
              Cancel
            </Button>
            <Button type="submit" size="sm" className="h-8 md:h-10 text-xs md:text-sm shadow-lg shadow-primary/20" disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />}
              {saving ? '' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      <motion.form variants={itemVariants} onSubmit={handleSubmit} className="bg-card md:bg-transparent rounded-xl md:rounded-none border md:border-none p-3 md:p-0 space-y-3 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
          <div className="space-y-1">
            <label htmlFor="name" className="text-xs font-semibold text-foreground ml-1">Full Name <span className="text-destructive">*</span></label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange as any}
              icon={<User className="h-3.5 w-3.5 md:h-4 md:w-4" />}
              required
              disabled={!editing}
              className="h-9 text-xs md:h-10 md:text-sm px-3 py-1"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-semibold text-foreground ml-1">Email Address</label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange as any}
              icon={<Mail className="h-3.5 w-3.5 md:h-4 md:w-4" />}
              disabled
              className="h-9 text-xs md:h-10 md:text-sm px-3 py-1 opacity-70"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="phone" className="text-xs font-semibold text-foreground ml-1">Phone Number</label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange as any}
              icon={<Phone className="h-3.5 w-3.5 md:h-4 md:w-4" />}
              disabled={!editing}
              className="h-9 text-xs md:h-10 md:text-sm px-3 py-1"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="company" className="text-xs font-semibold text-foreground ml-1">Company</label>
            <Input
              id="company"
              value={formData.company}
              onChange={handleChange as any}
              icon={<Building className="h-3.5 w-3.5 md:h-4 md:w-4" />}
              disabled={!editing}
              className="h-9 text-xs md:h-10 md:text-sm px-3 py-1"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="address" className="text-xs font-semibold text-foreground ml-1">Address</label>
          <TextArea
            id="address"
            value={formData.address}
            onChange={handleChange}
            rows={2}
            disabled={!editing}
            className="text-xs md:text-sm py-2 px-3 min-h-[60px]"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="bio" className="text-xs font-semibold text-foreground ml-1">Bio</label>
          <TextArea
            id="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={3}
            disabled={!editing}
            className="text-xs md:text-sm py-2 px-3 min-h-[80px]"
          />
          <p className="text-[10px] text-muted-foreground ml-1">Tell us a little about yourself</p>
        </div>

      </motion.form>
    </motion.div>
  );
};

export default UserProfileSettings;