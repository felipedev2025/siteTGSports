import "server-only";
import { prisma } from "@/lib/db";

interface AuditParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
}

export async function recordAudit(params: AuditParams) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      before: params.before === undefined ? undefined : (params.before as object),
      after: params.after === undefined ? undefined : (params.after as object),
      ip: params.ip ?? null,
    },
  });
}
