export const STAFF_ROLES = [
  'owner',
  'manager',
  'office',
  'designer',
  'production',
  'purchase',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

const STAFF_ROLE_ALIASES: Record<string, StaffRole> = {
  // Legacy values in this repo
  owner: 'owner',
  manager: 'manager',
  staff: 'office',
  admin: 'manager',

  // Current canonical roles
  office: 'office',
  designer: 'designer',
  production: 'production',
  purchase: 'purchase',
};

export function normalizeStaffRole(rawRole: string | null | undefined): StaffRole | null {
  if (!rawRole) return null;
  const normalized = rawRole.trim().toLowerCase();
  return STAFF_ROLE_ALIASES[normalized] ?? null;
}

export function hasAnyStaffRole(
  rawRole: string | null | undefined,
  allowedRoles: readonly StaffRole[]
): boolean {
  const role = normalizeStaffRole(rawRole);
  if (!role) return false;
  return allowedRoles.includes(role);
}

export function isStaff(rawRole: string | null | undefined): boolean {
  return normalizeStaffRole(rawRole) !== null;
}

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  owner: 'Owner',
  manager: 'Manager',
  office: 'Office',
  designer: 'Designer',
  production: 'Production',
  purchase: 'Purchase',
};

