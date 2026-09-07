import { randomUUID } from "node:crypto";
import { db } from "@/db/client";
import { auditLog } from "@/db/schema";

export async function recordAudit(args: {
  actorUserId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}) {
  await db.insert(auditLog).values({
    id: randomUUID(),
    actorUserId: args.actorUserId,
    action: args.action,
    targetType: args.targetType,
    targetId: args.targetId,
    details: args.details ? JSON.stringify(args.details) : null,
  });
}
