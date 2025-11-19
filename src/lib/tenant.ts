import { auth } from '@clerk/nextjs/server';

export async function getCurrentSchoolId(): Promise<string | null> {
  if (process.env.MULTI_TENANT !== 'true') return null;
  const { sessionClaims } = await auth();
  const metadata = sessionClaims?.metadata as { schoolId?: string } | undefined;
  return metadata?.schoolId || null;
}

export function withSchoolScope<T extends Record<string, unknown>>(where: T, schoolId: string | null): T {
  if (process.env.MULTI_TENANT !== 'true' || !schoolId) return where;
  return { ...where, schoolId } as T;
}


