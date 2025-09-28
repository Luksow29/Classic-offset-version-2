-- Enable Realtime on orders and payments tables
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table payments;
