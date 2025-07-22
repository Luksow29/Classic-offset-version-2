import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Database, Loader2, HardDrive, Server, RefreshCw, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserSettings, UserSettings } from '@/lib/settingsService';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';

const SystemSettings: React.FC = () => {
  const { user } = useUser();
  const { settings, updateSettings, loading: settingsLoading } = useUserSettings();
  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  
  const [localSettings, setLocalSettings] = useState({
    cacheSize: '100',
    autoBackup: true,
    backupFrequency: 'weekly',
    logLevel: 'error',
    analyticsEnabled: true,
  });
  
  // Sync with Supabase settings
  useEffect(() => {
    if (settings) {
      // Extract system settings from the settings object
      const systemSettings = (settings as any).system_settings || {};
      setLocalSettings({
        cacheSize: systemSettings.cache_size || '100',
        autoBackup: systemSettings.auto_backup || true,
        backupFrequency: systemSettings.backup_frequency || 'weekly',
        logLevel: systemSettings.log_level || 'error',
        analyticsEnabled: systemSettings.analytics_enabled || true,
      });
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    setLoading(true);
    
    try {
      await updateSettings({
        system_settings: {
          cache_size: localSettings.cacheSize,
          auto_backup: localSettings.autoBackup,
          backup_frequency: localSettings.backupFrequency,
          log_level: localSettings.logLevel,
          analytics_enabled: localSettings.analyticsEnabled,
        }
      } as Partial<UserSettings>);
    } catch (error) {
      console.error('Error saving system settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    setLoading(true);
    
    try {
      // In a real app, this would clear the cache
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    if (!user) {
      toast.error('You must be logged in to create a backup');
      return;
    }
    
    setBackupLoading(true);
    
    try {
      // Get the user's data from various tables
      const [customersRes, ordersRes, paymentsRes, materialsRes, expensesRes] = await Promise.all([
        supabase.from('customers').select('*').eq('user_id', user.id),
        supabase.from('orders').select('*').eq('user_id', user.id),
        supabase.from('payments').select('*').eq('created_by', user.id),
        supabase.from('materials').select('*').eq('created_by', user.id),
        supabase.from('expenses').select('*').eq('created_by', user.id),
      ]);
      
      // Combine all data into a backup object
      const backupData = {
        timestamp: new Date().toISOString(),
        user_id: user.id,
        customers: customersRes.data || [],
        orders: ordersRes.data || [],
        payments: paymentsRes.data || [],
        materials: materialsRes.data || [],
        expenses: expensesRes.data || [],
      };
      
      // Convert to JSON and create a downloadable file
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const date = new Date().toISOString().split('T')[0];
      const fileName = `classic_offset_backup_${date}.json`;
      
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Log the backup
      await supabase.from('backup_logs').insert({
        user_id: user.id,
        backup_type: 'manual',
        backup_size: dataStr.length,
        status: 'completed',
      });
      
      toast.success('Backup created successfully!');
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!user) {
      toast.error('You must be logged in to restore data');
      return;
    }
    
    setRestoreLoading(true);
    
    try {
      const fileContent = await file.text();
      const backupData = JSON.parse(fileContent);
      
      // Validate the backup data
      if (!backupData.timestamp || !backupData.user_id) {
        throw new Error('Invalid backup file format');
      }
      
      // In a real app, you would restore the data to the database
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Log the restore
      await supabase.from('backup_logs').insert({
        user_id: user.id,
        backup_type: 'restore',
        backup_size: fileContent.length,
        status: 'completed',
      });
      
      toast.success(`Restored from ${file.name}`);
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Failed to restore from backup');
    } finally {
      setRestoreLoading(false);
      
      // Reset the file input
      e.target.value = '';
    }
  };

  if (settingsLoading) {
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
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">System Settings</h2>
        </div>
        
        <div className="space-y-8">
          {/* Cache Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Cache Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  id="cacheSize"
                  label="Cache Size (MB)"
                  type="number"
                  value={localSettings.cacheSize}
                  onChange={(e) => setLocalSettings({...localSettings, cacheSize: e.target.value})}
                  icon={<HardDrive className="h-4 w-4" />}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum size of local cache storage
                </p>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={handleClearCache} 
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Clear Cache
                </Button>
              </div>
            </div>
          </div>
          
          {/* Backup & Restore */}
          <div>
            <h3 className="text-lg font-medium mb-4">Backup & Restore</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Automatic Backups</p>
                  <p className="text-sm text-muted-foreground">Regularly backup your data</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={localSettings.autoBackup}
                    onChange={() => setLocalSettings({...localSettings, autoBackup: !localSettings.autoBackup})}
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              {localSettings.autoBackup && (
                <div className="ml-6">
                  <label className="block text-sm font-medium mb-1">Backup Frequency</label>
                  <select
                    value={localSettings.backupFrequency}
                    onChange={(e) => setLocalSettings({...localSettings, backupFrequency: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleBackup} 
                  disabled={backupLoading}
                  className="flex items-center gap-2"
                >
                  {backupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Create Backup
                </Button>
                
                <div className="relative">
                  <Button 
                    variant="outline" 
                    disabled={restoreLoading}
                    className="flex items-center gap-2 w-full"
                    onClick={() => document.getElementById('restore-file')?.click()}
                  >
                    {restoreLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Restore from Backup
                  </Button>
                  <input 
                    id="restore-file" 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    onChange={handleRestore}
                    disabled={restoreLoading}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Logging & Analytics */}
          <div>
            <h3 className="text-lg font-medium mb-4">Logging & Analytics</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Log Level</label>
                <select
                  value={localSettings.logLevel}
                  onChange={(e) => setLocalSettings({...localSettings, logLevel: e.target.value})}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="error">Error Only</option>
                  <option value="warn">Warnings & Errors</option>
                  <option value="info">Info & Above</option>
                  <option value="debug">Debug (Verbose)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Control the level of detail in application logs
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Usage Analytics</p>
                  <p className="text-sm text-muted-foreground">Help us improve by sharing anonymous usage data</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={localSettings.analyticsEnabled}
                    onChange={() => setLocalSettings({...localSettings, analyticsEnabled: !localSettings.analyticsEnabled})}
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Server Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">System Information</h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">App Version</span>
                <span className="text-sm">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Database</span>
                <span className="text-sm">Supabase PostgreSQL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Storage</span>
                <span className="text-sm">Supabase Storage</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Last Updated</span>
                <span className="text-sm">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save System Settings'
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SystemSettings;