export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  user_status?: { status: 'active' | 'inactive' | 'suspended'; } | null;
  [key: string]: any;
}
