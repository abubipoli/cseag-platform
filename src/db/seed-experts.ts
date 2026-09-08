// Migrates the ~20 existing public expert profiles from
// teams.cyberexpertgh.org into the new unified platform (SRS Section 10 —
// Migration Considerations). Data (name, years of experience, areas of
// expertise, bio, photo) was pulled from the live public Experts directory
// on 2026-09-07, since every field there is already published with no
// visibility control today — see SRS Section 2.2.
//
// These accounts are created with placeholder emails/phones and a random
// password: we don't have the members' real contact details (they aren't
// published on the public profiles), so real credentials can't be issued
// yet. Each member should be migrated properly by an admin using the
// "Reset password" action on /admin/members once their real email/phone is
// on file — the placeholder @migrated.cyberexpertgh.org email domain flags
// which accounts still need that.
//
// Safe to re-run: skips any expert whose email already exists.
//
// Usage: npx tsx src/db/seed-experts.ts

import { randomUUID, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./client";
import { users, memberProfiles, type MembershipCategory } from "./schema";
import { hashPassword } from "../lib/auth";

interface LegacyExpert {
  fullName: string;
  yearsOfExperience: number;
  areasOfExpertise: string[];
  bio: string;
  currentRole?: string;
  employer?: string;
  certifications?: string[];
  membershipCategory: MembershipCategory;
  photoFile: string;
}

const LEGACY_EXPERTS: LegacyExpert[] = [
  {
    fullName: "Ernest Ofosu Larbi",
    yearsOfExperience: 10,
    areasOfExpertise: ["Physical Security", "Security Awareness Training", "Mobile Security", "Digital Forensics"],
    bio: "A security specialist with a decade of experience in physical security operations, spanning CCTV technologies, drone security applications, and risk assessment. Focused on protecting critical infrastructure and advancing digital forensic investigation.",
    membershipCategory: "full_professional",
    photoFile: "ernest-ofosu-larbi.jpg",
  },
  {
    fullName: "Abubakar Issaka",
    yearsOfExperience: 10,
    areasOfExpertise: [
      "Governance Risk and Compliance",
      "Security Awareness Training",
      "Cloud Security",
      "Cyber Threat Intelligence",
      "Penetration Testing (Ethical Hacking)",
    ],
    bio: "Specializes in cybersecurity consulting, training, and information security policy. Has collaborated with organizations including SNV Ghana, GIZ, the African Development Bank, and the Ghana Cooperative Credit Union Association, with a professional focus on data protection.",
    currentRole: "President, CSEAG · CEO, Bipoli Technologies",
    employer: "Bipoli Technologies",
    membershipCategory: "full_professional",
    photoFile: "abubakar-issaka.jpg",
  },
  {
    fullName: "Godson Charnor",
    yearsOfExperience: 10,
    areasOfExpertise: [
      "Security Information and Event Management (SIEM)",
      "Secure Software Development",
      "Incident Response",
      "Data Protection",
      "Cyber Threat Intelligence",
      "Cybersecurity Policy Development",
      "Cybersecurity Risk Assessment",
      "Security Auditing",
    ],
    bio: "Started his technology career in 2016 and now leads EITSEC Technologies Ltd, an IT services firm delivering in-depth analysis, consultation, and tailored IT solutions for business and institutional clients.",
    currentRole: "Co-founder & Team Lead",
    employer: "EITSEC Technologies Ltd",
    membershipCategory: "full_professional",
    photoFile: "godson-charnor.jpg",
  },
  {
    fullName: "Richard Nana Adu",
    yearsOfExperience: 20,
    areasOfExpertise: [
      "Security Architecture and Engineering",
      "Governance Risk and Compliance",
      "Security Information and Event Management (SIEM)",
      "Physical Security",
      "Security Awareness Training",
      "Access Control",
      "Identity and Access Management (IAM)",
      "Incident Response",
      "Security Operations",
      "Vulnerability Management",
      "Data Protection",
      "Cybersecurity Policy Development",
      "Endpoint Security",
      "Cybersecurity Risk Assessment",
      "Supply Chain Security",
      "Security Auditing",
      "IoT Security",
    ],
    bio: "A CCISO and CISA-certified information security leader with a background spanning IT and banking.",
    currentRole: "Chief Information Security Officer",
    certifications: ["CCISO", "CISA"],
    membershipCategory: "full_professional",
    photoFile: "richard-nana-adu.jpg",
  },
  {
    fullName: "Albert Kwei",
    yearsOfExperience: 3,
    areasOfExpertise: [
      "Business Continuity and Disaster Recovery",
      "Security Architecture and Engineering",
      "Governance Risk and Compliance",
      "Security Awareness Training",
      "Secure Software Development",
      "Access Control",
      "Social Engineering Prevention",
      "Incident Response",
      "Data Protection",
      "Cyber Threat Intelligence",
      "Cybersecurity Policy Development",
      "Digital Forensics",
      "Cybersecurity Risk Assessment",
      "Security Auditing",
      "IoT Security",
      "Penetration Testing (Ethical Hacking)",
    ],
    bio: "Previously an Information Systems and Business Analyst in software development for 12 years across education and financial sectors. Now a cyber security and digital forensic specialist investigating complex cyber-attacks and implementing protective measures for sensitive data.",
    currentRole: "Cyber Security & Digital Forensics Specialist",
    membershipCategory: "associate",
    photoFile: "albert-kwei.jpg",
  },
  {
    fullName: "Shadrack Opoku Frimpong",
    yearsOfExperience: 5,
    areasOfExpertise: [
      "Business Continuity and Disaster Recovery",
      "Governance Risk and Compliance",
      "Security Awareness Training",
      "Access Control",
      "Identity and Access Management (IAM)",
      "Social Engineering Prevention",
      "Data Protection",
      "Cybersecurity Policy Development",
      "Endpoint Security",
      "Cybersecurity Risk Assessment",
      "Security Auditing",
      "Penetration Testing (Ethical Hacking)",
    ],
    bio: "A Chartered Accountant and tax consultant who designs and implements internal controls to identify, prevent, and detect cyber risk across business and financial systems, with a focus on phishing and business email compromise.",
    currentRole: "Auditor & Cybersecurity Professional",
    membershipCategory: "associate",
    photoFile: "shadrack-opoku-frimpong.jpg",
  },
  {
    fullName: "Kofi Koomson",
    yearsOfExperience: 2,
    areasOfExpertise: ["Social Engineering Prevention", "Vulnerability Management", "Cyber Threat Intelligence", "Penetration Testing (Ethical Hacking)"],
    bio: "A young associate in training with a background in non-profit organizations and IT support, and programming skills in C, Python, and JavaScript. Bilingual in French and English.",
    currentRole: "Associate (In Training)",
    membershipCategory: "student",
    photoFile: "kofi-koomson.jpg",
  },
  {
    fullName: "Benjamin Makafui Jackson",
    yearsOfExperience: 3,
    areasOfExpertise: [
      "Business Continuity and Disaster Recovery",
      "Security Architecture and Engineering",
      "Governance Risk and Compliance",
      "Industrial Control Systems (ICS) Security",
      "Security Information and Event Management (SIEM)",
      "Physical Security",
      "Security Awareness Training",
      "Secure Software Development",
      "Access Control",
      "Malware Analysis and Defense",
      "Identity and Access Management (IAM)",
      "Social Engineering Prevention",
      "Incident Response",
      "Cloud Security",
      "Mobile Security",
      "Security Operations",
      "Vulnerability Management",
      "Data Protection",
      "Zero Trust Security",
      "Cyber Threat Intelligence",
      "Cybersecurity Policy Development",
      "Cybersecurity Risk Assessment",
      "Data Loss Prevention (DLP)",
      "Supply Chain Security",
      "Security Auditing",
      "IoT Security",
    ],
    bio: "Holds certifications from ISC2, IBM, Cisco, Google, Fortinet, Oracle, PMI, and SANS. Specializes in secure cloud architecture, incident response, and compliance auditing, and coaches teams toward cyber-resilience.",
    currentRole: "Cloud Security Specialist",
    certifications: ["ISC2", "IBM", "Cisco", "Google", "Fortinet", "Oracle", "PMI", "SANS Institute"],
    membershipCategory: "associate",
    photoFile: "benjamin-makafui-jackson.jpg",
  },
  {
    fullName: "Stephen Asante-Kusi",
    yearsOfExperience: 14,
    areasOfExpertise: [
      "Governance Risk and Compliance",
      "Physical Security",
      "Security Awareness Training",
      "Access Control",
      "Vulnerability Management",
      "Cybersecurity Policy Development",
      "Cybersecurity Risk Assessment",
    ],
    bio: "A cybersecurity leader who relocated to Ghana after 14 years with U.S. federal agencies including the Department of Defense, Department of Homeland Security, and FBI as a contractor.",
    currentRole: "Cybersecurity & Risk Management Specialist",
    employer: "Golden Tintona Investment Holding",
    certifications: ["PMP", "CDPSE", "CASP+", "CCISO", "CISM", "Security+ CE", "CSM", "MCP", "MTA"],
    membershipCategory: "full_professional",
    photoFile: "stephen-asante-kusi.jpeg",
  },
  {
    fullName: "Seidu Osumanu",
    yearsOfExperience: 25,
    areasOfExpertise: [
      "Business Continuity and Disaster Recovery",
      "Governance Risk and Compliance",
      "Security Information and Event Management (SIEM)",
      "Physical Security",
      "Security Awareness Training",
      "Crypto Forensics",
      "Access Control",
      "Identity and Access Management (IAM)",
      "Social Engineering Prevention",
      "Incident Response",
      "Mobile Security",
      "Security Operations",
      "Vulnerability Management",
      "Data Protection",
      "Cyber Threat Intelligence",
      "Cybersecurity Policy Development",
      "Digital Forensics",
      "Cybersecurity Risk Assessment",
      "Data Loss Prevention (DLP)",
      "IoT Security",
    ],
    bio: "A crypto forensics expert with a quarter-century of cyber security experience.",
    currentRole: "Crypto Expert",
    membershipCategory: "full_professional",
    photoFile: "seidu-osumanu.jpg",
  },
  {
    fullName: "Samuel Hanson Aryee",
    yearsOfExperience: 6,
    areasOfExpertise: [
      "Business Continuity and Disaster Recovery",
      "Security Architecture and Engineering",
      "Security Information and Event Management (SIEM)",
      "Physical Security",
      "Access Control",
      "Identity and Access Management (IAM)",
      "Cloud Security",
      "Security Operations",
      "Data Protection",
      "Cybersecurity Policy Development",
      "Endpoint Security",
      "Cybersecurity Risk Assessment",
      "Data Loss Prevention (DLP)",
      "IoT Security",
    ],
    bio: "An efficient cloud engineer with extensive experience in cloud infrastructure, network engineering, and information security, implementing best practices across cloud functions, applications, and databases.",
    currentRole: "Cloud Engineer",
    membershipCategory: "associate",
    photoFile: "samuel-hanson-aryee.jpg",
  },
  {
    fullName: "Roland Dunee",
    yearsOfExperience: 5,
    areasOfExpertise: ["Governance Risk and Compliance", "Security Operations", "Endpoint Security", "Penetration Testing (Ethical Hacking)"],
    bio: "Pursuing an MSc in IT with a cybersecurity specialization at Carnegie Mellon University. Previously an IT Officer at Buck Press Limited, contributing to national-level projects.",
    currentRole: "IT Officer · MSc Cybersecurity Candidate",
    employer: "Buck Press Limited",
    membershipCategory: "student",
    photoFile: "roland-dunee.jpeg",
  },
  {
    fullName: "Amos Agudey Teye",
    yearsOfExperience: 5,
    areasOfExpertise: ["Penetration Testing (Ethical Hacking)"],
    bio: "Broad technical background spanning Point of Sale terminal systems (Ingenico, Telepower) alongside electrical installation and fire alarm systems for domestic and industrial applications.",
    membershipCategory: "associate",
    photoFile: "amos-agudey-teye.jpg",
  },
  {
    fullName: "Abu Safian Blay",
    yearsOfExperience: 8,
    areasOfExpertise: [
      "Industrial Control Systems (ICS) Security",
      "Security Awareness Training",
      "Secure Software Development",
      "Malware Analysis and Defense",
      "Social Engineering Prevention",
      "Incident Response",
      "Cloud Security",
      "Mobile Security",
      "Vulnerability Management",
      "Zero Trust Security",
      "Cyber Threat Intelligence",
      "Cybersecurity Policy Development",
      "Endpoint Security",
      "Digital Forensics",
      "Cybersecurity Risk Assessment",
      "Supply Chain Security",
      "IoT Security",
      "Penetration Testing (Ethical Hacking)",
    ],
    bio: "A licensed cybersecurity professional accredited by Ghana's Cyber Security Authority and a recognized authority in ethical hacking and IT solutions, serving clients from government agencies to Fortune 500 companies. International speaker and trainer; recipient of a National Business Honours Award.",
    currentRole: "Chief Executive Officer",
    employer: "Inveteck Global",
    membershipCategory: "full_professional",
    photoFile: "abu-safian-blay.jpg",
  },
  {
    fullName: "Dr. Muhammed Siraj",
    yearsOfExperience: 24,
    areasOfExpertise: [
      "Business Continuity and Disaster Recovery",
      "Governance Risk and Compliance",
      "Security Information and Event Management (SIEM)",
      "Cryptography",
      "Security Awareness Training",
      "Secure Software Development",
      "Access Control",
      "Malware Analysis and Defense",
      "Social Engineering Prevention",
      "Incident Response",
      "Cloud Security",
      "Mobile Security",
      "Vulnerability Management",
      "Data Protection",
      "Zero Trust Security",
      "Cyber Threat Intelligence",
      "Cybersecurity Policy Development",
      "Endpoint Security",
      "Digital Forensics",
      "IoT Security",
      "Penetration Testing (Ethical Hacking)",
    ],
    bio: "PhD in Security in Computing (blockchain security) from University Putra Malaysia, MSc in ICT from Aalborg University, Denmark, and a BSc from the University of Ghana. Previously Acting Director of ICT and Data Protection Supervisor at Wisconsin International University College.",
    currentRole: "Senior Lecturer, Academic City University College",
    employer: "Academic City University College",
    certifications: ["Certified Ethical Hacker (CEH)", "CHFI", "Certified Data Protection Supervisor (CDPS)"],
    membershipCategory: "full_professional",
    photoFile: "muhammed-siraj.jpg",
  },
  {
    fullName: "Evans Owusu-Hammond",
    yearsOfExperience: 15,
    areasOfExpertise: [
      "Governance Risk and Compliance",
      "Physical Security",
      "Security Awareness Training",
      "Social Engineering Prevention",
      "Cloud Security",
      "Security Operations",
      "Vulnerability Management",
      "Cyber Threat Intelligence",
      "Cybersecurity Policy Development",
      "Endpoint Security",
      "Digital Forensics",
      "Cybersecurity Risk Assessment",
      "Penetration Testing (Ethical Hacking)",
    ],
    bio: "A cybersecurity professional with 15 years of experience across governance, risk, and security operations.",
    currentRole: "Cybersecurity Professional",
    membershipCategory: "full_professional",
    photoFile: "evans-owusu-hammond.jpg",
  },
  {
    fullName: "Patrick Arhinful",
    yearsOfExperience: 2,
    areasOfExpertise: ["Security Awareness Training", "Cybersecurity Risk Assessment", "Penetration Testing (Ethical Hacking)"],
    bio: "A dynamic and hardworking young professional with capabilities spanning networking, vulnerability assessment, and penetration testing, along with Windows/Linux systems and IT support.",
    membershipCategory: "student",
    photoFile: "patrick-arhinful.jpg",
  },
  {
    fullName: "Dominic Akamara Alokopo",
    yearsOfExperience: 10,
    areasOfExpertise: [
      "Security Information and Event Management (SIEM)",
      "Security Awareness Training",
      "Malware Analysis and Defense",
      "Incident Response",
      "Cloud Security",
      "Mobile Security",
      "Security Operations",
      "Vulnerability Management",
      "Data Protection",
      "Cyber Threat Intelligence",
      "Cybersecurity Policy Development",
      "Endpoint Security",
      "Digital Forensics",
      "Cybersecurity Risk Assessment",
      "Penetration Testing (Ethical Hacking)",
    ],
    bio: "A digital forensics examiner who has collaborated with government agencies and private enterprises, bringing practical, hands-on experience across a wide range of systems and technologies.",
    currentRole: "Digital Forensics Examiner",
    membershipCategory: "full_professional",
    photoFile: "dominic-akamara-alokopo.jpg",
  },
  {
    fullName: "Justice A. Yaro",
    yearsOfExperience: 10,
    areasOfExpertise: [
      "Business Continuity and Disaster Recovery",
      "Cryptography",
      "Physical Security",
      "Access Control",
      "Social Engineering Prevention",
      "Incident Response",
      "Mobile Security",
      "Vulnerability Management",
      "Cyber Threat Intelligence",
      "Cybersecurity Policy Development",
      "Digital Forensics",
      "Cybersecurity Risk Assessment",
      "Penetration Testing (Ethical Hacking)",
    ],
    bio: "A network engineer and cybersecurity specialist with a decade of experience in the field.",
    currentRole: "Network Engineer & Cybersecurity Expert",
    membershipCategory: "full_professional",
    photoFile: "justice-a-yaro.jpg",
  },
  {
    fullName: "Jerry Yayra Kwaku Anku",
    yearsOfExperience: 11,
    areasOfExpertise: [
      "Business Continuity and Disaster Recovery",
      "Security Awareness Training",
      "Access Control",
      "Social Engineering Prevention",
      "Cloud Security",
      "Vulnerability Management",
      "Data Loss Prevention (DLP)",
    ],
    bio: "A strategic, collaborative IT leader with extensive experience managing complex IT infrastructure, spanning network administration, cybersecurity, system architecture, and cross-functional project leadership.",
    currentRole: "Senior Information Systems Officer",
    membershipCategory: "full_professional",
    photoFile: "jerry-yayra-kwaku-anku.jpg",
  },
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (const expert of LEGACY_EXPERTS) {
    const slug = expert.fullName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/(^\.|\.$)/g, "");
    const email = `${slug}@migrated.cyberexpertgh.org`;

    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) {
      skipped++;
      continue;
    }

    const userId = randomUUID();
    await db.insert(users).values({
      id: userId,
      email,
      passwordHash: await hashPassword(randomBytes(24).toString("hex")),
      role: "member",
      isActive: true,
    });

    await db.insert(memberProfiles).values({
      id: randomUUID(),
      userId,
      fullName: expert.fullName,
      phone: "+233000000000", // placeholder — not published, real number pending from member
      employer: expert.employer,
      currentRole: expert.currentRole,
      yearsOfExperience: expert.yearsOfExperience,
      certifications: JSON.stringify(expert.certifications || []),
      areasOfExpertise: JSON.stringify(expert.areasOfExpertise),
      bio: expert.bio,
      photoUrl: `/uploads/${expert.photoFile}`,
      membershipCategory: expert.membershipCategory,
      // These fields were already published with no visibility control on
      // teams.cyberexpertgh.org (SRS 2.2), so carrying that forward is a
      // neutral migration, not a new disclosure.
      bioIsPublic: true,
      yearsOfExperienceIsPublic: true,
      areasOfExpertiseIsPublic: true,
      employerRoleIsPublic: !!(expert.employer || expert.currentRole),
      certificationsIsPublic: !!(expert.certifications && expert.certifications.length > 0),
      photoIsPublic: true,
      // Service requests are admin-mediated (an admin follows up with the
      // expert directly), not emailed straight to them — so this is safe
      // to enable even before a real email/phone is on file.
      allowPublicContact: true,
      isListedInDirectory: true,
    });

    created++;
  }

  console.log(`Migrated ${created} expert profile(s) from teams.cyberexpertgh.org, skipped ${skipped} already present.`);
}

main().then(() => process.exit(0));
