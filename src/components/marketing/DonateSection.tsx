"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { IconHeart, IconShieldCheck, IconGraduationCap, IconMessageSquare } from "@/components/ui/icons";
import { DonateModal } from "./DonateModal";

const IMPACT = [
  { icon: IconShieldCheck, label: "Funds rapid incident-response support for scam and breach victims" },
  { icon: IconGraduationCap, label: "Trains school pupils and everyday Ghanaians to spot online scams" },
  { icon: IconMessageSquare, label: "Keeps our public awareness campaigns running year-round" },
];

export function DonateSection() {
  const [open, setOpen] = useState(false);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-amber-50 py-16">
      <div
        className="absolute -top-24 right-[-5%] h-72 w-72 rounded-full bg-rose-200/40 blur-[100px]"
        aria-hidden
      />
      <div
        className="absolute -bottom-24 left-[-5%] h-72 w-72 rounded-full bg-amber-200/40 blur-[100px]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Reveal>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <IconHeart className="h-7 w-7" />
          </span>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-rose-600">Support the mission</p>
          <h2 className="font-serif-display mt-2 text-2xl text-navy-900 sm:text-3xl">
            Help us fight cybercrime in Ghana
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Cybercrime doesn&rsquo;t wait, and neither do we. Your donation directly powers CSEAG&rsquo;s
            volunteer-driven work — from training vulnerable communities to responding when someone&rsquo;s already
            been hit. Every cedi helps keep Ghana&rsquo;s digital space a little safer.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
            {IMPACT.map((item) => (
              <div key={item.label} className="flex items-start gap-2 rounded-xl bg-white/70 p-3 text-xs text-slate-600 shadow-sm">
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={200}>
          <Button
            size="lg"
            onClick={() => setOpen(true)}
            className="mt-8 !bg-rose-500 text-white hover:!bg-rose-400 hover:shadow-[0_0_20px_-4px_rgba(244,63,94,0.5)]"
          >
            <IconHeart className="h-4 w-4" /> Donate Now
          </Button>
          <p className="mt-3 text-xs text-slate-400">Securely processed by Paystack. One-off gift — separate from member dues.</p>
        </Reveal>
      </div>

      {open && <DonateModal onClose={() => setOpen(false)} />}
    </section>
  );
}
