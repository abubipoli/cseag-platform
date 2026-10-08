"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconMessageSquare } from "@/components/ui/icons";
import RequestServiceModal from "./RequestServiceModal";

export function ExpertContactButton({ expertId, expertName }: { expertId: string; expertName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="mt-8">
        <IconMessageSquare className="h-4 w-4" /> Request Service
      </Button>
      {open && <RequestServiceModal expertId={expertId} expertName={expertName} onClose={() => setOpen(false)} />}
    </>
  );
}
