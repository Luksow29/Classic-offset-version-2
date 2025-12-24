import { supabase } from './supabaseClient';

/**
 * Logs user activity to Supabase
 * @param message The activity message to log
 * @param user The name of the user performing the action
 */
export const logActivity = async (message: string, user: string): Promise<void> => {
  try {
    const { error } = await supabase.from("activity_logs").insert({
      action_type: 'USER_ACTION',
      details: { 
        message, 
        user_name: user 
      },
      // Note: user_id is optional or we can rely on RLS/default if set, 
      // but for now we're storing the name in details for display
    });
    
    if (error) throw error;
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};
