export type TenantSelector = {
  source: "host" | "switch" | "none";
  slug?: string;
  tenantId?: string;
};

export function normalizeTenantHost(
  host?: string | string[],
): string | undefined {
  if (!host) return undefined;

  const raw = Array.isArray(host) ? host[0] : host;
  if (!raw) return undefined;

  const normalized = raw.split(":")[0].trim().toLowerCase();
  if (
    !normalized ||
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "ks-online-ordering-platform-backend"
  ) {
    return undefined;
  }

  const [firstLabel] = normalized.split(".");
  
  if (firstLabel === "ks-online-ordering-platform-backend") {
    return undefined;
  }

  return firstLabel && firstLabel.length > 0 ? firstLabel : undefined;
}

export function resolveTenantSelector(req: {
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, any>;
  user?: { globalRole?: "SUPER_ADMIN" | "TENANT_USER" };
  hostname?: string;
}): TenantSelector {
  const switchTenantId =
    typeof req.query?.switchTenantId === "string"
      ? req.query.switchTenantId
      : undefined;
  const switchTenantSlug =
    typeof req.query?.switchTenantSlug === "string"
      ? req.query.switchTenantSlug
      : undefined;

  if (
    req.user?.globalRole === "SUPER_ADMIN" &&
    (switchTenantId || switchTenantSlug)
  ) {
    return {
      source: "switch",
      tenantId: switchTenantId,
      slug: switchTenantSlug,
    };
  }

  const trustedHost =
    req.headers?.["x-forwarded-host"] || req.headers?.host || req.hostname;
  const slug = normalizeTenantHost(trustedHost);

  if (slug) {
    return { source: "host", slug };
  }

  return { source: "none" };
}
