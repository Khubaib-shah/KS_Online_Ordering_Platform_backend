/**
 * Triggers Next.js Storefront ISR On-Demand Tag Revalidation
 */
export async function triggerStorefrontRevalidation(
  tenantSlug: string,
  tag?: string
): Promise<boolean> {
  const storefrontUrl = process.env.STOREFRONT_URL || 'http://localhost:3000';
  const secret = process.env.REVALIDATE_SECRET || 'ks-revalidate-secret-dev-only';

  if (!tenantSlug) return false;

  try {
    const res = await fetch(`${storefrontUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret,
        slug: tenantSlug,
        tag,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      console.log(`[StorefrontRevalidate] Successfully revalidated cache for tenant: ${tenantSlug}`);
      return true;
    } else {
      const errText = await res.text().catch(() => '');
      console.warn(`[StorefrontRevalidate] Storefront revalidation failed (${res.status}): ${errText}`);
      return false;
    }
  } catch (error: any) {
    // Non-blocking: log warning without throwing
    console.warn(`[StorefrontRevalidate] Could not reach storefront at ${storefrontUrl}:`, error?.message || error);
    return false;
  }
}
