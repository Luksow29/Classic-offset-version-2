import React, { useState, useEffect, ChangeEventHandler } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { Loader2, User, Mail, Phone, MapPin, Building } from 'lucide-react';
import toast from 'react-hot-toast';

const UserProfileSettings: React.FC = () => {
  const { user, userProfile } = useUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    bio: '',
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: (userProfile as any)?.phone || '',
        address: (userProfile as any)?.address || '',
        company: (userProfile as any)?.company || '',
        bio: (userProfile as any)?.bio || '',
      });
    }
  }, [userProfile]);

  const handleChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
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
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-6">User Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            id="name"
            label="Full Name"
            value={formData.name}
            onChange={handleChange as any}
            icon={<User className="h-4 w-4" />}
            required
          />
          <Input
            id="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange as any}
            icon={<Mail className="h-4 w-4" />}
            disabled
            helperText="Email cannot be changed"
          />
          <Input
            id="phone"
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={handleChange as any}
            icon={<Phone className="h-4 w-4" />}
          />
          <Input
            id="company"
            label="Company"
            value={formData.company}
            onChange={handleChange as any}
            icon={<Building className="h-4 w-4" />}
          />
        </div>

        <TextArea
          id="address"
          label="Address"
          value={formData.address}
          onChange={handleChange}
          rows={3}
        />

        <TextArea
          id="bio"
          label="Bio"
          value={formData.bio}
          onChange={handleChange}
          rows={4}
          helperText="Tell us a little about yourself"
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default UserProfileSettings;