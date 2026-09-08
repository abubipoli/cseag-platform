"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { FieldWrap, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface Settings {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpFrom: string;
  smtpPassSet: boolean;
  smsProvider: string;
  smsSenderId: string;
  smsApiKeySet: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState({
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPass: "",
    smtpFrom: "",
    smsProvider: "",
    smsApiKey: "",
    smsSenderId: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/settings/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Settings | null) => {
        if (!d) return;
        setSettings(d);
        setForm((f) => ({
          ...f,
          smtpHost: d.smtpHost,
          smtpPort: d.smtpPort,
          smtpUser: d.smtpUser,
          smtpFrom: d.smtpFrom,
          smsProvider: d.smsProvider,
          smsSenderId: d.smsSenderId,
        }));
      });
  }

  useEffect(load, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("Settings saved.");
      setForm((f) => ({ ...f, smtpPass: "", smsApiKey: "" }));
      load();
    } else {
      setMessage("Couldn't save settings. Check the fields and try again.");
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/admin/settings/notifications/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: testPhone || undefined }),
    });
    setTesting(false);
    if (!res.ok) {
      setTestResult("Test failed to run.");
      return;
    }
    const data = await res.json();
    const parts = [
      `Email: ${data.email.ok ? "sent" : `failed (${data.email.error || "unknown error"})`}${data.email.usedConsoleFallback ? " — no SMTP configured, logged to server console instead" : ""}`,
    ];
    if (data.sms) {
      parts.push(
        `SMS: ${data.sms.ok ? "sent" : `failed (${data.sms.error || "unknown error"})`}${data.sms.usedConsoleFallback ? " — no SMS provider configured, logged to server console instead" : ""}`
      );
    }
    setTestResult(parts.join(" · "));
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Configure the email and SMS providers CSEAG uses to send notifications." />
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure the email and SMS providers CSEAG uses to send notifications." />

      {message && <p className="rounded-lg bg-slate-50 px-4 py-2.5 text-sm text-slate-600">{message}</p>}

      <Card>
        <CardBody className="space-y-4">
          <div>
            <h3 className="font-semibold text-navy-900">Email (SMTP)</h3>
            <p className="text-sm text-slate-500">Works with Google Workspace, Zoho Mail, Microsoft 365, or any SMTP-based provider.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrap label="SMTP host" hint="e.g. smtp.gmail.com">
              <Input value={form.smtpHost} onChange={(e) => setForm((f) => ({ ...f, smtpHost: e.target.value }))} />
            </FieldWrap>
            <FieldWrap label="SMTP port" hint="587 (TLS) or 465 (SSL)">
              <Input value={form.smtpPort} onChange={(e) => setForm((f) => ({ ...f, smtpPort: e.target.value }))} />
            </FieldWrap>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrap label="SMTP username">
              <Input value={form.smtpUser} onChange={(e) => setForm((f) => ({ ...f, smtpUser: e.target.value }))} />
            </FieldWrap>
            <FieldWrap label="SMTP password" hint={settings.smtpPassSet ? "A password is already saved. Leave blank to keep it." : "Not set yet."}>
              <Input type="password" value={form.smtpPass} onChange={(e) => setForm((f) => ({ ...f, smtpPass: e.target.value }))} placeholder={settings.smtpPassSet ? "••••••••" : ""} />
            </FieldWrap>
          </div>
          <FieldWrap label="From address" hint="Shown as the sender on outgoing emails, e.g. no-reply@cyberexpertgh.org">
            <Input value={form.smtpFrom} onChange={(e) => setForm((f) => ({ ...f, smtpFrom: e.target.value }))} />
          </FieldWrap>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <div>
            <h3 className="font-semibold text-navy-900">SMS</h3>
            <p className="text-sm text-slate-500">Ghana-based SMS aggregators, both with free trial credits.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrap label="Provider">
              <Select value={form.smsProvider} onChange={(e) => setForm((f) => ({ ...f, smsProvider: e.target.value }))}>
                <option value="">None (log to console)</option>
                <option value="arkesel">Arkesel</option>
                <option value="mnotify">mNotify</option>
              </Select>
            </FieldWrap>
            <FieldWrap label="Sender ID" hint="Max 11 characters, e.g. CSEAG">
              <Input value={form.smsSenderId} onChange={(e) => setForm((f) => ({ ...f, smsSenderId: e.target.value }))} maxLength={11} />
            </FieldWrap>
          </div>
          <FieldWrap label="API key" hint={settings.smsApiKeySet ? "A key is already saved. Leave blank to keep it." : "Not set yet."}>
            <Input type="password" value={form.smsApiKey} onChange={(e) => setForm((f) => ({ ...f, smsApiKey: e.target.value }))} placeholder={settings.smsApiKeySet ? "••••••••" : ""} />
          </FieldWrap>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div>
            <h3 className="font-semibold text-navy-900">Send a test</h3>
            <p className="text-sm text-slate-500">
              Sends a test email to your own account address, and a test SMS if you provide a number, using whatever is
              currently saved above.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <FieldWrap label="Phone number (optional, for SMS test)" className="flex-1">
              <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="+233241234567" />
            </FieldWrap>
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? "Sending..." : "Send test"}
            </Button>
          </div>
          {testResult && <p className="text-sm text-slate-600">{testResult}</p>}
        </CardBody>
      </Card>
    </div>
  );
}
