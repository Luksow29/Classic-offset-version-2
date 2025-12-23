
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/services/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/useToast";
import { z } from "zod";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  Edit,
  Accessibility,
  Palette
} from "lucide-react";
import { Tables } from "@/services/supabase/types";
import { Switch } from "@/shared/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

type Customer = Tables<'customers'>;

// Custom settings interface for our app (not tied to DB schema)
interface AppSettings {
  high_contrast?: boolean;
  font_size?: string;
}

interface CustomerProfileProps {
  customer: Customer;
  onUpdate: (customer: Customer) => void;
}

export default function CustomerProfile({ customer, onUpdate }: CustomerProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({});
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    name: customer.name || "",
    email: customer.email || "",
    phone: customer.phone || "",
    address: customer.address || "",
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();
  // Zod validation schema
  const profileSchema = z.object({
    name: z.string().min(2, { message: "Name is required" }),
    email: z.string().email({ message: "Invalid email address" }),
    phone: z.string().min(8, { message: "Phone is required" }),
    address: z.string().min(2, { message: "Address is required" }),
  });

  // Validate a single field
  const validateField = (field: string, value: string) => {
    try {
      // Use .shape[field] to validate a single field
      profileSchema.shape[field].parse(value);
      setFormErrors(prev => ({ ...prev, [field]: "" }));
    } catch (e) {
      if (e instanceof z.ZodError) {
        setFormErrors(prev => ({ ...prev, [field]: e.errors?.[0]?.message || "Invalid" }));
      } else {
        setFormErrors(prev => ({ ...prev, [field]: "Invalid" }));
      }
    }
  };

  // Validate all fields
  const validateAll = () => {
    try {
      profileSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        const errors: { [key: string]: string } = {};
        e.errors.forEach((err) => {
          if (err.path[0]) {
            errors[String(err.path[0])] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  useEffect(() => {
    // Fetch user settings when the component loads
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', customer.user_id);

      if (data && data.length > 0) {
        // Convert key-value rows to settings object
        const settingsObj: AppSettings = {};
        data.forEach((row) => {
          if (row.setting_key === 'high_contrast') {
            settingsObj.high_contrast = row.setting_value === true || row.setting_value === 'true';
          } else if (row.setting_key === 'font_size') {
            settingsObj.font_size = String(row.setting_value || 'base');
          }
        });
        setSettings(settingsObj);
        // Apply initial settings
        applySettings(settingsObj);
      } else if (error && error.code !== 'PGRST116') { // Ignore "no rows found" error
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, [customer.user_id]);

  const applySettings = (newSettings: AppSettings) => {
    const root = document.documentElement;
    // High Contrast
    if (newSettings.high_contrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    // Font Size
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    if (newSettings.font_size) {
      root.classList.add(`text-${newSettings.font_size}`);
    }
  };

  const handleSettingsChange = async (key: keyof AppSettings, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applySettings(newSettings);

    // Check if setting already exists
    const { data: existingData } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', customer.user_id)
      .eq('setting_key', key)
      .single();

    let error;
    if (existingData) {
      // Update existing setting
      const result = await supabase
        .from('user_settings')
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq('id', existingData.id);
      error = result.error;
    } else {
      // Insert new setting
      const result = await supabase
        .from('user_settings')
        .insert({ 
          user_id: customer.user_id, 
          setting_key: key,
          setting_value: value
        });
      error = result.error;
    }

    if (error) {
      console.error("Settings save error:", error);
      toast({ title: "Error", description: "Could not save settings.", variant: "destructive" });
    } else {
      toast({ title: "Settings Saved", description: `${String(key).replace('_', ' ')} updated.` });
    }
  };


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleSave = async () => {
    if (!validateAll()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please fix the errors in the form." });
      return;
    }
    setIsLoading(true);
    const { data: updatedCustomer, error } = await supabase
      .from("customers")
      .update(formData)
      .eq("id", customer.id)
      .select()
      .single();
    setIsLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
    } else if (updatedCustomer) {
      toast({ title: "Success", description: "Profile updated successfully." });
      onUpdate(updatedCustomer);
      setIsEditing(false);
    }
  };

  const ProfileItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | null | undefined }) => (
    <div className="flex items-start gap-4">
      <div className="text-muted-foreground mt-1">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value || "-"}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('profile.title')}</CardTitle>
            <CardDescription>{t('profile.desc', 'View and manage your personal information.')}</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={() => setIsEditing(!isEditing)}>
            <Edit className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">{t('profile.full_name', 'Full Name')}</Label>
                  <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} aria-invalid={!!formErrors.name} />
                  {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="email">{t('profile.email', 'Email')}</Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} aria-invalid={!!formErrors.email} />
                  {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">{t('profile.phone', 'Phone')}</Label>
                  <Input id="phone" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} aria-invalid={!!formErrors.phone} />
                  {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
                </div>
                <div>
                  <Label htmlFor="address">{t('profile.address', 'Address')}</Label>
                  <Input id="address" value={formData.address} onChange={e => handleInputChange('address', e.target.value)} aria-invalid={!!formErrors.address} />
                  {formErrors.address && <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>{t('cancel')}</Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span className="ml-2">{t('save')}</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileItem icon={<User size={20} />} label={t('profile.full_name', 'Full Name')} value={customer.name} />
              <ProfileItem icon={<Mail size={20} />} label={t('profile.email', 'Email')} value={customer.email} />
              <ProfileItem icon={<Phone size={20} />} label={t('profile.phone', 'Phone')} value={customer.phone} />
              <ProfileItem icon={<MapPin size={20} />} label={t('profile.address', 'Address')} value={customer.address} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loyalty Membership Card */}
      <Card className="border-purple-100 dark:border-purple-900 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Palette className="h-5 w-5" />
            {t('profile.loyalty_title', 'Loyalty Membership')}
          </CardTitle>
          <CardDescription>
            {t('profile.loyalty_desc', 'Your rewards status and referral details.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Current Balance</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{customer.loyalty_points || 0}</p>
                <p className="text-xs text-purple-500 mt-1">Points Available</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                <Palette className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Referral Code</p>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => {
                  if (customer.referral_code) {
                    navigator.clipboard.writeText(customer.referral_code);
                    toast({ title: "Copied!", description: "Referral code copied to clipboard." });
                  }
                }}>Copy</Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white dark:bg-gray-900 px-3 py-2 rounded-md border border-dashed border-blue-300 dark:border-blue-700 font-mono text-lg tracking-wider flex-1 text-center">
                  {customer.referral_code || "NO-CODE"}
                </div>
              </div>
              <p className="text-xs text-blue-500 mt-2">Share this code to earn bonus points!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Accessibility /> {t('profile.accessibility')}</CardTitle>
          <CardDescription>{t('profile.accessibility_desc', 'Customize the appearance of the portal to suit your needs.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="high-contrast" className="font-semibold">{t('profile.high_contrast', 'High Contrast Mode')}</Label>
              <p className="text-sm text-muted-foreground">{t('profile.high_contrast_desc', 'Increases text and background contrast.')}</p>
            </div>
            <Switch
              id="high-contrast"
              checked={settings.high_contrast || false}
              onCheckedChange={(value) => handleSettingsChange('high_contrast', value)}
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="font-size" className="font-semibold">{t('profile.font_size', 'Font Size')}</Label>
              <p className="text-sm text-muted-foreground">{t('profile.font_size_desc', 'Adjust the text size for better readability.')}</p>
            </div>
            <Select
              value={settings.font_size || 'base'}
              onValueChange={(value) => handleSettingsChange('font_size', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('profile.font_size', 'Font Size')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">{t('profile.font_size_small', 'Small')}</SelectItem>
                <SelectItem value="base">{t('profile.font_size_default', 'Default')}</SelectItem>
                <SelectItem value="lg">{t('profile.font_size_large', 'Large')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Language Switcher */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="language" className="font-semibold">{t('profile.language', 'Language')}</Label>
              <p className="text-sm text-muted-foreground">{t('profile.language_desc', 'Choose your preferred language.')}</p>
            </div>
            <Select
              value={i18n.language.startsWith('ta') ? 'ta' : 'en'}
              onValueChange={(lng) => i18n.changeLanguage(lng)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('profile.language', 'Language')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('profile.english', 'English')}</SelectItem>
                <SelectItem value="ta">{t('profile.tamil', 'Tamil')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
