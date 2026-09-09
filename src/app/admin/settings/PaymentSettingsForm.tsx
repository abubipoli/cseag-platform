"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { FieldWrap, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { IconArrowRight } from "@/components/ui/icons";

interface Settings {
  duesAmountGhs: number;
  paystackPublicKey: string;
  paystackSecretKeySet: boolean;
}

export default function PaymentSettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState({ duesAmountGhs: "", paystackPublicKey: "", paystackSecretKey: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/settings/payments")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Settings | null) => {
        if (!d) return;
        setSettings(d);
        setForm((f) => ({ ...f, duesAmountGhs: d.duesAmountGhs ? String(d.duesAmountGhs) : "", paystackPublicKey: d.paystackPublicKey }));
      });
  }

  useEffect(load, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/settings/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("Payment settings saved.");
      setForm((f) => ({ ...f, paystackSecretKey: "" }));
      load();
    } else {
      setMessage("Couldn't save settings. Check the fields and try again.");
    }
  }

  if (!settings) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-slate-400">Loading…</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardBody className="space-y-4">
          <div>
            <h3 className="font-semibold text-navy-900">Membership dues & payments</h3>
            <p className="text-sm text-slate-500">
              Set the annual dues amount and connect Paystack so members can optionally pay online from their
              dashboard. Payment isn&rsquo;t enforced anywhere — this just gives members a way to see and settle
              what they owe.
            </p>
          </div>
          <FieldWrap label="Annual dues amount (GHS)" hint="Same amount for every member, e.g. 150" className="sm:w-56">
            <Input
              type="number"
              min={0}
              value={form.duesAmountGhs}
              onChange={(e) => setForm((f) => ({ ...f, duesAmountGhs: e.target.value }))}
            />
          </FieldWrap>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrap label="Paystack public key" hint="Starts with pk_">
              <Input
                value={form.paystackPublicKey}
                onChange={(e) => setForm((f) => ({ ...f, paystackPublicKey: e.target.value }))}
                placeholder="pk_live_..."
              />
            </FieldWrap>
            <FieldWrap
              label="Paystack secret key"
              hint={settings.paystackSecretKeySet ? "A key is already saved. Leave blank to keep it." : "Starts with sk_ — not set yet."}
            >
              <Input
                type="password"
                value={form.paystackSecretKey}
                onChange={(e) => setForm((f) => ({ ...f, paystackSecretKey: e.target.value }))}
                placeholder={settings.paystackSecretKeySet ? "••••••••" : "sk_live_..."}
              />
            </FieldWrap>
          </div>
          {!settings.paystackSecretKeySet && (
            <p className="text-xs text-slate-400">
              Online payment stays hidden on member dashboards until both Paystack keys are set. Get them from your
              Paystack dashboard under Settings → API Keys & Webhooks.
            </p>
          )}
        </CardBody>
      </Card>

      {message && <p className="rounded-lg bg-slate-50 px-4 py-2.5 text-sm text-slate-600">{message}</p>}

      <div className="flex items-center justify-between">
        <Link href="/admin/dues" className="inline-flex items-center gap-1 text-sm font-semibold text-accent-600 hover:text-accent-700">
          View dues report <IconArrowRight className="h-4 w-4" />
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save payment settings"}
        </Button>
      </div>
    </>
  );
}
