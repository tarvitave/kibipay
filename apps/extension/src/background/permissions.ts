import type { DAppPermission } from '@kibipay/shared-types';

const PERMISSIONS_KEY = 'kibipay_permissions';

async function loadPermissions(): Promise<DAppPermission[]> {
  const result = await chrome.storage.local.get(PERMISSIONS_KEY);
  return (result[PERMISSIONS_KEY] as DAppPermission[] | undefined) ?? [];
}

async function savePermissions(permissions: DAppPermission[]): Promise<void> {
  await chrome.storage.local.set({ [PERMISSIONS_KEY]: permissions });
}

export async function getPermission(origin: string): Promise<DAppPermission | null> {
  const permissions = await loadPermissions();
  return permissions.find((p) => p.origin === origin) ?? null;
}

export async function hasPermission(origin: string): Promise<boolean> {
  const perm = await getPermission(origin);
  return perm !== null;
}

export async function grantPermission(
  origin: string,
  publicKey: string,
  meta?: { favicon?: string; name?: string },
): Promise<void> {
  const permissions = await loadPermissions();
  const existing = permissions.findIndex((p) => p.origin === origin);
  const entry: DAppPermission = {
    origin,
    publicKey,
    grantedAt: Date.now(),
    favicon: meta?.favicon,
    name: meta?.name,
  };
  if (existing >= 0) {
    permissions[existing] = entry;
  } else {
    permissions.push(entry);
  }
  await savePermissions(permissions);
}

export async function revokePermission(origin: string): Promise<void> {
  const permissions = await loadPermissions();
  await savePermissions(permissions.filter((p) => p.origin !== origin));
}

export async function listPermissions(): Promise<DAppPermission[]> {
  return loadPermissions();
}
