import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Import used icons directly for tree-shaking
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Frown from 'lucide-react/dist/esm/icons/frown';
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle';

// Manually import all icons that could be dynamically chosen.
// This is a trade-off to allow dynamic icons from the DB while still enabling tree-shaking.
// For a fully dynamic solution, a different approach (like a build script) would be needed.
const AllIcons: { [key: string]: React.FC<any> } = {
  Activity: React.lazy(() => import('lucide-react/dist/esm/icons/activity')),
  Award: React.lazy(() => import('lucide-react/dist/esm/icons/award')),
  BadgeCheck: React.lazy(() => import('lucide-react/dist/esm/icons/badge-check')),
  Banknote: React.lazy(() => import('lucide-react/dist/esm/icons/banknote')),
  BarChart: React.lazy(() => import('lucide-react/dist/esm/icons/bar-chart')),
  Briefcase: React.lazy(() => import('lucide-react/dist/esm/icons/briefcase')),
  Building: React.lazy(() => import('lucide-react/dist/esm/icons/building')),
  CheckCircle: React.lazy(() => import('lucide-react/dist/esm/icons/check-circle')),
  Clipboard: React.lazy(() => import('lucide-react/dist/esm/icons/clipboard')),
  Clock: React.lazy(() => import('lucide-react/dist/esm/icons/clock')),
  Code: React.lazy(() => import('lucide-react/dist/esm/icons/code')),
  CreditCard: React.lazy(() => import('lucide-react/dist/esm/icons/credit-card')),
  Database: React.lazy(() => import('lucide-react/dist/esm/icons/database')),
  DollarSign: React.lazy(() => import('lucide-react/dist/esm/icons/dollar-sign')),
  Feather: React.lazy(() => import('lucide-react/dist/esm/icons/feather')),
  File: React.lazy(() => import('lucide-react/dist/esm/icons/file')),
  Gift: React.lazy(() => import('lucide-react/dist/esm/icons/gift')),
  Globe: React.lazy(() => import('lucide-react/dist/esm/icons/globe')),
  Heart: React.lazy(() => import('lucide-react/dist/esm/icons/heart')),
  Home: React.lazy(() => import('lucide-react/dist/esm/icons/home')),
  Image: React.lazy(() => import('lucide-react/dist/esm/icons/image')),
  Layers: React.lazy(() => import('lucide-react/dist/esm/icons/layers')),
  Link: React.lazy(() => import('lucide-react/dist/esm/icons/link')),
  Lock: React.lazy(() => import('lucide-react/dist/esm/icons/lock')),
  Mail: React.lazy(() => import('lucide-react/dist/esm/icons/mail')),
  MapPin: React.lazy(() => import('lucide-react/dist/esm/icons/map-pin')),
  Package: React.lazy(() => import('lucide-react/dist/esm/icons/package')),
  Phone: React.lazy(() => import('lucide-react/dist/esm/icons/phone')),
  PieChart: React.lazy(() => import('lucide-react/dist/esm/icons/pie-chart')),
  Power: React.lazy(() => import('lucide-react/dist/esm/icons/power')),
  Rocket: React.lazy(() => import('lucide-react/dist/esm/icons/rocket')),
  Save: React.lazy(() => import('lucide-react/dist/esm/icons/save')),
  Settings: React.lazy(() => import('lucide-react/dist/esm/icons/settings')),
  Share2: React.lazy(() => import('lucide-react/dist/esm/icons/share-2')),
  Shield: React.lazy(() => import('lucide-react/dist/esm/icons/shield')),
  ShoppingBag: React.lazy(() => import('lucide-react/dist/esm/icons/shopping-bag')),
  ShoppingCart: React.lazy(() => import('lucide-react/dist/esm/icons/shopping-cart')),
  Smile: React.lazy(() => import('lucide-react/dist/esm/icons/smile')),
  Speaker: React.lazy(() => import('lucide-react/dist/esm/icons/speaker')),
  Star: React.lazy(() => import('lucide-react/dist/esm/icons/star')),
  Tag: React.lazy(() => import('lucide-react/dist/esm/icons/tag')),
  Target: React.lazy(() => import('lucide-react/dist/esm/icons/target')),
  ThumbsUp: React.lazy(() => import('lucide-react/dist/esm/icons/thumbs-up')),
  Truck: React.lazy(() => import('lucide-react/dist/esm/icons/truck')),
  User: React.lazy(() => import('lucide-react/dist/esm/icons/user')),
  Users: React.lazy(() => import('lucide-react/dist/esm/icons/users')),
  Video: React.lazy(() => import('lucide-react/dist/esm/icons/video')),
  Zap: React.lazy(() => import('lucide-react/dist/esm/icons/zap')),
  // Add more icons here as needed
};

interface Feature {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  order_index: number;
  is_active: boolean;
}

const HighlightFeatures: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatures = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('features')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (fetchError) throw fetchError;

        setFeatures(data || []);
      } catch (err: any) {
        console.error('❌ Error fetching features:', err.message);
        setError(`Failed to load features: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  const getLucideIcon = (iconName: string) => {
    const IconComponent = AllIcons[iconName];
    if (IconComponent) {
      return (
        <React.Suspense fallback={<Loader2 size={28} className="animate-spin" />}>
          <IconComponent size={28} />
        </React.Suspense>
      );
    }
    return <HelpCircle size={28} />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading features...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  if (features.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <Frown className="w-12 h-12 mb-4" />
        <p className="text-lg font-semibold">No features defined yet.</p>
        <p className="text-sm">Add features in your admin panel.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feat) => (
        <div
          key={feat.id}
          className="flex items-start gap-4 bg-card p-4 rounded-lg shadow border border-border"
        >
          <div className="text-primary">{getLucideIcon(feat.icon_name)}</div>
          <div>
            <h4 className="text-md font-semibold text-card-foreground mb-1">{feat.title}</h4>
            <p className="text-sm text-muted-foreground">{feat.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HighlightFeatures;
