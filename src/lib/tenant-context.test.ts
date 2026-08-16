import { resolveTenantSelector, normalizeTenantHost } from "./tenant-context";

describe("tenant-context", () => {
  it("normalizes hostnames and strips ports", () => {
    expect(normalizeTenantHost("tenant.example.com:3000")).toBe("tenant");
    expect(normalizeTenantHost(undefined)).toBeUndefined();
  });

  it("resolves public tenant context from trusted host only", () => {
    const selector = resolveTenantSelector({
      headers: { host: "demo.localhost:3000" },
      query: {},
      user: undefined,
    } as any);

    expect(selector.source).toBe("host");
    expect(selector.slug).toBe("demo");
    expect(selector.tenantId).toBeUndefined();
  });

  it("allows super admins to switch tenant via explicit param only", () => {
    const selector = resolveTenantSelector({
      headers: { host: "public.localhost" },
      query: { switchTenantId: "tenant-123" },
      user: { globalRole: "SUPER_ADMIN" },
    } as any);

    expect(selector.source).toBe("switch");
    expect(selector.tenantId).toBe("tenant-123");
    expect(selector.slug).toBeUndefined();
  });

  it("ignores client-supplied tenant headers for public resolution", () => {
    const selector = resolveTenantSelector({
      headers: {
        "x-tenant-slug": "evil",
        "x-tenant-id": "evil-123",
        host: "demo.localhost",
      },
      query: { tenantSlug: "also-evil" },
      user: undefined,
    } as any);

    expect(selector.source).toBe("host");
    expect(selector.slug).toBe("demo");
    expect(selector.tenantId).toBeUndefined();
  });
});
