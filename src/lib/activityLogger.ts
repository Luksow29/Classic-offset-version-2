import { db } from './firebaseClient';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { supabase } from './supabaseClient';

/**
 * Logs user activity to both Firestore and Supabase
 * @param message The activity message to log
 * @param user The name of the user performing the action
 */
export const logActivity = async (message: string, user: string): Promise<void> => {
  try {
    // Log to Firestore for real-time updates
    await addDoc(collection(db, "activity_logs"), {
      message,
      user,
      timestamp: serverTimestamp()
    });
    
    // Also log to Supabase for SQL querying and long-term storage
    await supabase.from("activity_logs").insert({
      action_type: message,
      user_id: "00000000-0000-0000-0000-000000000000", // Placeholder UUID
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};
