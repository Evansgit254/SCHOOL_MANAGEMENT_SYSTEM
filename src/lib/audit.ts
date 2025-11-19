import prisma from './prisma';

export async function writeAuditLog(params: { actorId: string; action: string; entity: string; entityId: string; meta?: Record<string, unknown> }) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        meta: params.meta as any,
      },
    });
  } catch {
    // swallow
  }
}


