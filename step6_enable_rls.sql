-- ==============================================
-- STEP 6: ENABLE ROW LEVEL SECURITY (RLS) 
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

SELECT 'Step 6: RLS enabled successfully!' as status;
