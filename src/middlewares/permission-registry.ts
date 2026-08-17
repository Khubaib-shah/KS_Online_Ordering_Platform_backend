// ─── Permission Registry ───────────────────────────────────────────
// Central definition of all valid modules and their allowed actions.

export interface PermissionDefinition {
  label: string;
  actions: string[];
}

export const PERMISSION_REGISTRY: Record<string, PermissionDefinition> = {
  orders: { label: 'Orders', actions: ['View', 'Create', 'Edit', 'Delete', 'Cancel', 'Refund', 'AssignRider'] },
  menu: { label: 'Menu', actions: ['View', 'Create', 'Edit', 'Delete'] },
  staff: { label: 'Staff', actions: ['View', 'Create', 'Edit', 'Delete'] },
  roles: { label: 'Roles', actions: ['View', 'Create', 'Edit', 'Delete'] },
  reports: { label: 'Reports', actions: ['View', 'Export'] },
  settings: { label: 'Settings', actions: ['View', 'Edit', 'Create', 'Delete'] },
  branches: { label: 'Branches', actions: ['View', 'Create', 'Edit', 'Delete'] },
  customers: { label: 'Customers', actions: ['View', 'Edit'] },
  pos: { label: 'POS', actions: ['View', 'Create', 'OpenShift', 'CloseShift'] },
};

/**
 * Validates if a module and action pair is valid according to the registry.
 * Throws an error at startup if an invalid combination is registered.
 */
export function validatePermissionRegistration(module: string, action: string) {
  const mod = PERMISSION_REGISTRY[module];
  if (!mod) {
    throw new Error(`Invalid permission module registered: ${module}`);
  }
  
  if (!mod.actions.includes(action)) {
    throw new Error(`Invalid action '${action}' registered for module '${module}'`);
  }
}
