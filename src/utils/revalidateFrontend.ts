/**
 * Utility to trigger on-demand ISR revalidation on the Next.js frontend
 * immediately whenever content is created, updated, or deleted in Payload CMS.
 */
export async function revalidateFrontend(
  paths: string[],
  revalidateAll = false,
): Promise<void> {
  const rawUrl =
    process.env.PAYLOAD_PUBLIC_FRONTEND_URL ||
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    'https://megaman-frontend.vercel.app';
  const frontendUrl = rawUrl.replace(/\/+$/, '');
  const secret = process.env.REVALIDATE_SECRET || 'megaman-revalidate-2026';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${frontendUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify({ secret, paths, revalidateAll }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(
        `[revalidateFrontend] Failed (${res.status}) for paths:`,
        paths,
      );
    }
  } catch (err) {
    // Non-fatal: never block CMS save operations if frontend is unreachable
    console.warn('[revalidateFrontend] Request error:', err);
  } finally {
    clearTimeout(timeout);
  }
}

export function createRevalidateHooks(
  getPaths: (doc: any) => string[],
  revalidateAll = false,
) {
  return {
    afterChange: [
      async ({ doc }: { doc: any }) => {
        await revalidateFrontend(getPaths(doc), revalidateAll);
        return doc;
      },
    ],
    afterDelete: [
      async ({ doc }: { doc: any }) => {
        await revalidateFrontend(getPaths(doc), revalidateAll);
        return doc;
      },
    ],
  };
}
