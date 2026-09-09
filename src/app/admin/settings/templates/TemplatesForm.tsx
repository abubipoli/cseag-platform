"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FieldWrap, Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { IconChevronDown, IconChevronRight } from "@/components/ui/icons";

interface Template {
  key: string;
  label: string;
  variables: string[];
  isCustomized: boolean;
  emailSubject: string;
  emailBody: string;
  smsBody: string;
}

export default function TemplatesForm() {
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { emailSubject: string; emailBody: string; smsBody: string }>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [messageKey, setMessageKey] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/settings/templates")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { templates: Template[] } | null) => {
        if (!d) return;
        setTemplates(d.templates);
        setDrafts(
          Object.fromEntries(
            d.templates.map((t) => [t.key, { emailSubject: t.emailSubject, emailBody: t.emailBody, smsBody: t.smsBody }])
          )
        );
      });
  }

  useEffect(load, []);

  async function handleSave(key: string) {
    setSavingKey(key);
    setMessageKey(null);
    const res = await fetch(`/api/admin/settings/templates/${key}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(drafts[key]),
    });
    setSavingKey(null);
    setMessageKey(key);
    if (res.ok) load();
  }

  async function handleReset(key: string) {
    setSavingKey(key);
    await fetch(`/api/admin/settings/templates/${key}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailSubject: "", emailBody: "", smsBody: "" }),
    });
    setSavingKey(null);
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification templates"
        description="Customize the wording CSEAG sends for each event. Email and SMS are edited separately — SMS should stay short."
      />
      <Link href="/admin/settings" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
        ← Back to Settings
      </Link>

      {!templates ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => {
            const isOpen = open === t.key;
            const draft = drafts[t.key] || { emailSubject: "", emailBody: "", smsBody: "" };
            return (
              <Card key={t.key}>
                <button
                  onClick={() => setOpen(isOpen ? null : t.key)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6"
                >
                  <span className="flex items-center gap-2.5">
                    {isOpen ? <IconChevronDown className="h-4 w-4 text-slate-400" /> : <IconChevronRight className="h-4 w-4 text-slate-400" />}
                    <span className="font-medium text-navy-900">{t.label}</span>
                  </span>
                  {t.isCustomized && <Badge tone="accent">Customized</Badge>}
                </button>

                {isOpen && (
                  <CardBody className="space-y-4 border-t border-slate-100">
                    {t.variables.length > 0 && (
                      <p className="text-xs text-slate-500">
                        Available placeholders:{" "}
                        {t.variables.map((v) => (
                          <code key={v} className="mx-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                            {`{{${v}}}`}
                          </code>
                        ))}
                      </p>
                    )}

                    <FieldWrap label="Email subject">
                      <Input
                        value={draft.emailSubject}
                        onChange={(e) => setDrafts((d) => ({ ...d, [t.key]: { ...draft, emailSubject: e.target.value } }))}
                      />
                    </FieldWrap>
                    <FieldWrap label="Email body" hint="Blank lines start a new paragraph.">
                      <Textarea
                        rows={6}
                        value={draft.emailBody}
                        onChange={(e) => setDrafts((d) => ({ ...d, [t.key]: { ...draft, emailBody: e.target.value } }))}
                      />
                    </FieldWrap>
                    <FieldWrap label="SMS message" hint="Keep this short — SMS is charged per ~160 characters and is sent separately from email, even when both are enabled.">
                      <Textarea
                        rows={2}
                        value={draft.smsBody}
                        onChange={(e) => setDrafts((d) => ({ ...d, [t.key]: { ...draft, smsBody: e.target.value } }))}
                      />
                    </FieldWrap>

                    <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                      <Button onClick={() => handleSave(t.key)} disabled={savingKey === t.key}>
                        {savingKey === t.key ? "Saving..." : "Save"}
                      </Button>
                      {t.isCustomized && (
                        <Button variant="outline" onClick={() => handleReset(t.key)} disabled={savingKey === t.key}>
                          Reset to default
                        </Button>
                      )}
                      {messageKey === t.key && <span className="text-sm text-accent-700">Saved.</span>}
                    </div>
                  </CardBody>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
