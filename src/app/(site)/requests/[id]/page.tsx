"use client";

import { Suspense, use as usePromise } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ServiceRequestChat } from "@/components/ServiceRequestChat";
import { IconMessageSquare } from "@/components/ui/icons";

function RequesterChatPageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || undefined;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700">
          <IconMessageSquare className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-navy-900">Your conversation</h1>
          <p className="text-sm text-slate-500">Message the CSEAG expert assigned to your request.</p>
        </div>
      </div>

      {!token ? (
        <Card>
          <CardBody>
            <p className="text-sm text-red-600">
              This link is missing its access token. Please use the link from your email.
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Service Request</p>
          </CardHeader>
          <CardBody>
            <ServiceRequestChat serviceRequestId={id} token={token} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default function RequesterChatPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <RequesterChatPageInner params={params} />
    </Suspense>
  );
}
