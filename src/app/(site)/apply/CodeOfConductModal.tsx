"use client";

import { IconX } from "@/components/ui/icons";

const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "1. Purpose & Commitment",
    items: [
      "This Code of Professional Conduct sets the ethical and professional standards that members of the Cyber Security Experts Association of Ghana (CSEAG) must uphold to foster integrity, professionalism, and accountability in Ghana's cybersecurity ecosystem.",
    ],
  },
  {
    title: "2. Professional Integrity & Ethical Responsibility",
    items: [
      "Conduct all professional activities with honesty, diligence, and competency.",
      "Uphold the principles of integrity, fairness, and transparency in cybersecurity practice.",
      "Avoid conflicts of interest and act in the best interests of Ghana's cybersecurity ecosystem.",
    ],
  },
  {
    title: "3. Confidentiality & Data Protection",
    items: [
      "Safeguard sensitive, proprietary, and classified information, ensuring confidentiality and responsible handling.",
      "Comply with Ghana's Cybersecurity Act, 2020 (Act 1038), as well as international data protection frameworks.",
    ],
  },
  {
    title: "4. Compliance with Legal & Regulatory Frameworks",
    items: [
      "Adhere to national cybersecurity laws, policies, and industry standards.",
      "Actively contribute to strengthening Ghana's cybersecurity governance and regulatory structures.",
      "Avoid misconduct that could damage the reputation of CSEAG, the cybersecurity profession, or national security interests.",
    ],
  },
  {
    title: "5. Professional Development & Capacity Building",
    items: [
      "Continuously pursue professional growth through education, research, and skills enhancement.",
      "Mentor and support fellow members, fostering a culture of knowledge exchange within CSEAG.",
      "Champion innovation and resilience to address Ghana's evolving cybersecurity challenges.",
    ],
  },
  {
    title: "6. Commitment to National Cybersecurity Resilience",
    items: [
      "Advocate for robust cybersecurity policies that enhance Ghana's digital security posture.",
      "Support strategic initiatives that promote cybersecurity awareness and education.",
      "Work collaboratively with government institutions, private sector entities, and academia to advance national cybersecurity priorities.",
    ],
  },
  {
    title: "7. Active Engagement in Association Activities",
    items: [
      "Participate in CSEAG events, conferences, and forums, contributing to the advancement of Ghana's cybersecurity profession.",
      "Engage in constructive discussions within CSEAG's platforms to foster collaboration and best practices.",
      "Represent CSEAG with professionalism in national and international cybersecurity engagements.",
    ],
  },
  {
    title: "8. Financial & Administrative Responsibilities",
    items: [
      "Fulfil financial obligations to CSEAG, including timely payment of membership dues and fees.",
      "Exercise financial accountability in supporting the Association's initiatives and operations.",
    ],
  },
  {
    title: "9. Inclusivity, Fairness & Leadership in Cybersecurity",
    items: [
      "Promote diversity, equal opportunity, and inclusivity within CSEAG and Ghana's broader cybersecurity community.",
      "Exhibit professionalism, respect, and ethical conduct in all cybersecurity engagements.",
      "Report violations of this code to designated authorities to uphold integrity and accountability within CSEAG.",
    ],
  },
];

const DISCIPLINARY_ITEMS = [
  ["Warning:", "Issued for minor infractions to remind the member of their ethical obligations."],
  ["Suspension:", "Temporary removal of membership privileges pending resolution."],
  ["Termination of Membership:", "Severe violations may result in expulsion from CSEAG."],
  ["Legal Action:", "In cases of criminal misconduct, the matter may be referred to relevant legal authorities."],
];

export default function CodeOfConductModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-navy-950/50 backdrop-blur-[1px]" />
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-navy-900">CSEAG Code of Professional Conduct</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 text-sm leading-relaxed text-slate-700 scrollbar-thin">
          {SECTIONS.map((section) => (
            <div key={section.title} className="mb-5">
              <p className="font-semibold text-navy-900">{section.title}</p>
              {section.items.length === 1 ? (
                <p className="mt-1.5">{section.items[0]}</p>
              ) : (
                <ul className="mt-1.5 list-disc space-y-1 pl-5">
                  {section.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div className="mb-5">
            <p className="font-semibold text-navy-900">10. Disciplinary Actions for Violations</p>
            <p className="mt-1.5">
              Failure to adhere to this Code of Conduct may result in disciplinary actions, including but not limited to:
            </p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5">
              {DISCIPLINARY_ITEMS.map(([label, body]) => (
                <li key={label}>
                  <span className="font-medium text-navy-900">{label}</span> {body}
                </li>
              ))}
            </ul>
            <p className="mt-1.5">
              The CSEAG Disciplinary Committee shall review reported violations and apply appropriate disciplinary
              measures in accordance with the Association&rsquo;s regulations.
            </p>
          </div>

          <div>
            <p className="font-semibold text-navy-900">11. Amendment Policy</p>
            <p className="mt-1.5">
              This Code of Conduct may be reviewed periodically to align with evolving cybersecurity best practices
              and national policy changes. Amendments shall be proposed by the Executive Committee and ratified by
              members before adoption.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-navy-950 shadow-sm transition-all hover:bg-accent-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
