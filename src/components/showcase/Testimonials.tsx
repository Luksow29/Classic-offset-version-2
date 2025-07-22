import React, { useEffect, useState } from 'react'; // useEffect, useState ஐ சேர்க்கவும்
import { supabase } from '@/lib/supabaseClient'; // supabase ஐ சேர்க்கவும்
import { Loader2, AlertTriangle, Frown, Star } from 'lucide-react'; // லோடிங்/பிழை ஐகான்கள் மற்றும் Star ஐகானைச் சேர்க்கவும்

// Testimonial க்கான interface
interface Testimonial {
  id: string;
  client_name: string;
  message: string;
  rating: number | null; // Nullable, as it's optional
  is_approved: boolean;
  created_at: string;
}

const Testimonials: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('testimonials')
          .select('*')
          .eq('is_approved', true) // அங்கீகரிக்கப்பட்ட கருத்துக்களை மட்டும் பெறவும்
          .order('created_at', { ascending: false }); // சமீபத்தியவை முதலில்

        if (fetchError) throw fetchError;

        setTestimonials(data || []);
      } catch (err: any) {
        console.error('❌ Error fetching testimonials:', err.message);
        setError(`Failed to load testimonials: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading testimonials...</span>
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

  if (testimonials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <Frown className="w-12 h-12 mb-4" />
        <p className="text-lg font-semibold">No testimonials available yet.</p>
        <p className="text-sm">Please add and approve testimonials in the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {testimonials.map((t) => ( // key ஐ t.id ஐப் பயன்படுத்துதல்
        <div
          key={t.id}
          className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-md shadow border border-gray-200 dark:border-gray-700"
        >
          <p className="text-sm text-gray-700 dark:text-gray-200 italic mb-2">
            “{t.message}”
          </p>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
            – {t.client_name}
            {t.rating && ( // மதிப்பீடு இருந்தால் நட்சத்திரங்களைக் காட்டவும்
              <span className="ml-2 flex items-center">
                {Array(t.rating).fill(0).map((_, i) => (
                  <Star key={i} size={14} className="text-yellow-500 fill-current" />
                ))}
                {Array(5 - t.rating).fill(0).map((_, i) => (
                  <Star key={`empty-${i}`} size={14} className="text-gray-300" />
                ))}
              </span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
};

export default Testimonials;