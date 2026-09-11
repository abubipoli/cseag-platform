// GET /api/admin/reports/service-requests?format=csv|xlsx|json — the ticket
// queue as a flat export.
import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/client";
import { serviceRequests, memberProfiles } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { reportResponse, parseReportFormat, type ReportColumn } from "@/lib/reportResponse";

interface ServiceRequestRow {
  expertName: string;
  assignedExpertName: string | null;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string | null;
  message: string;
  status: string;
  createdAt: string;
}

const COLUMNS: ReportColumn<ServiceRequestRow>[] = [
  { key: "expertName", header: "Requested expert" },
  { key: "assignedExpertName", header: "Assigned to" },
  { key: "requesterName", header: "Requester" },
  { key: "requesterEmail", header: "Requester email" },
  { key: "requesterPhone", header: "Requester phone" },
  { key: "message", header: "Message" },
  { key: "status", header: "Status" },
  { key: "createdAt", header: "Submitted" },
];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "reportsServiceRequests"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignedProfile = alias(memberProfiles, "assigned_profile");

  const rows: ServiceRequestRow[] = await db
    .select({
      expertName: memberProfiles.fullName,
      assignedExpertName: assignedProfile.fullName,
      requesterName: serviceRequests.requesterName,
      requesterEmail: serviceRequests.requesterEmail,
      requesterPhone: serviceRequests.requesterPhone,
      message: serviceRequests.message,
      status: serviceRequests.status,
      createdAt: serviceRequests.createdAt,
    })
    .from(serviceRequests)
    .innerJoin(memberProfiles, eq(memberProfiles.userId, serviceRequests.expertUserId))
    .leftJoin(assignedProfile, eq(assignedProfile.userId, serviceRequests.assignedExpertUserId))
    .orderBy(desc(serviceRequests.createdAt));

  const format = parseReportFormat(req.nextUrl.searchParams.get("format"));
  return reportResponse(format, rows, COLUMNS, "cseag-service-requests");
}
