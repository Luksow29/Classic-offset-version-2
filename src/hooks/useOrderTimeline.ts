import { createOrderTimelineHook } from "@/shared/order-timeline";
import { supabase } from '@/lib/supabaseClient';

export const useOrderTimeline = createOrderTimelineHook(supabase);
