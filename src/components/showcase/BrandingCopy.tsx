import React, { useEffect, useState } from 'react'; // useEffect, useState ஐ சேர்க்கவும்
import { supabase } from '@/lib/supabaseClient'; // supabase ஐ சேர்க்கவும்
import { Loader2, AlertTriangle, Frown } from 'lucide-react'; // லோடிங்/பிழை ஐகான்களைச் சேர்க்கவும்

const BrandingCopy: React.FC = () => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('site_content')
          .select('content')
          .eq('section_name', 'BrandingCopyMain') // 'BrandingCopyMain' என்ற section_name ஐப் பெறவும்
          .single(); // ஒரே ஒரு பதிவுக்காக

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means "no rows found"
          throw fetchError;
        }

        setContent(data?.content || null); // உள்ளடக்கத்தைப் பெறவும்
      } catch (err: any) {
        console.error('❌ Error fetching branding content:', err.message);
        setError(`Failed to load branding content: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading branding content...</span>
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

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
        <Frown className="w-12 h-12 mb-4" />
        <p className="text-lg font-semibold">Branding content not available.</p>
        <p className="text-sm">Please add content for 'BrandingCopyMain' in the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed">
      {/* ⚠️ குறிப்பு: HTML உள்ளடக்கத்தைப் பாதுகாப்பாக ரெண்டர் செய்ய dangerouslySetInnerHTML ஐப் பயன்படுத்துகிறோம்.
         இது XSS தாக்குதல்களுக்கு வழிவகுக்கும், உள்ளடக்கத்தை நீங்கள் நம்பினால் மட்டுமே இதைப் பயன்படுத்தவும்.
         நிர்வாகப் பலகம் மூலம் உள்ளடக்கத்தை நீங்கள் நிர்வகித்தால் இது பொதுவாகப் பாதுகாப்பானது. */}
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export default BrandingCopy;