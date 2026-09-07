import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <section
        className="px-4 py-20 text-center text-white sm:px-6"
        style={{ background: "linear-gradient(135deg, var(--color-navy), #16324f)" }}
      >
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
            Cyber Security Experts Association of Ghana
          </p>
          <h1 className="mt-4 text-3xl font-bold sm:text-5xl">
            A united front of cybersecurity professionals, securing Ghana&rsquo;s digital future.
          </h1>
          <p className="mt-5 text-base text-slate-200 sm:text-lg">
            Join a trusted community of certified experts, share knowledge, and help shape a safer digital
            Ghana.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/apply"
              className="rounded-md px-6 py-3 text-sm font-semibold text-white shadow"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              Apply for Membership
            </Link>
            <Link
              href="/experts"
              className="rounded-md border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Browse the Expert Directory
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-[var(--color-navy)]">Our Core Values</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {[
            ["Integrity", "Honesty, transparency, and accountability in cybersecurity practice."],
            ["Professionalism", "Excellence, competence, and reliability."],
            ["Collaboration", "A united front across sectors and disciplines."],
            ["Continuous Learning", "Staying ahead of an ever-evolving threat landscape."],
            ["Public Service", "Promoting digital safety for every Ghanaian."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="font-semibold text-[var(--color-navy)]">{title}</p>
              <p className="mt-2 text-sm text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-[var(--color-navy)]">Ready to join CSEAG?</h2>
          <p className="mt-3 text-slate-600">
            Whether you&rsquo;re a student, a working professional, or represent an organization, there&rsquo;s a
            place for you. Apply online and hear back from our membership committee — you&rsquo;ll get an
            immediate email and SMS confirmation the moment you apply.
          </p>
          <Link
            href="/apply"
            className="mt-6 inline-block rounded-md px-6 py-3 text-sm font-semibold text-white shadow"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            Start Your Application
          </Link>
        </div>
      </section>
    </div>
  );
}
