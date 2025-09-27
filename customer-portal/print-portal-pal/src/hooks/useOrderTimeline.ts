import { createOrderTimelineHook } from '@shared/order-timeline';
import { supabase } from '@/integrations/supabase/client';

export const useOrderTimeline = createOrderTimelineHook(supabase);
