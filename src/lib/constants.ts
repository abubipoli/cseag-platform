// Areas of expertise — carried over from the existing teams.cyberexpertgh.org
// directory (Appendix A / Section 6.2 of the SRS) so migrated member data
// lines up with what applicants select going forward.
export const AREAS_OF_EXPERTISE = [
  "Business Continuity and Disaster Recovery",
  "Security Architecture and Engineering",
  "Governance Risk and Compliance",
  "Industrial Control Systems (ICS) Security",
  "Security Information and Event Management (SIEM)",
  "Cryptography",
  "Physical Security",
  "Security Awareness Training",
  "Crypto Forensics",
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
  "Endpoint Security",
  "Digital Forensics",
  "Cybersecurity Risk Assessment",
  "Data Loss Prevention (DLP)",
  "Supply Chain Security",
  "Security Auditing",
  "IoT Security",
  "Penetration Testing (Ethical Hacking)",
] as const;

// Ghana's 16 administrative regions (current, post-2019 split).
export const GHANA_REGIONS = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
] as const;

// Mirrors the CSEAG membership application form (Microsoft Forms).
export const TITLE_OPTIONS = ["Mr.", "Mrs.", "Miss", "Ms", "Dr", "Professor", "Honorable", "Other"] as const;

export const AGE_GROUPS = ["18-20", "21-30", "31-40", "41-50", "Above 50"] as const;

export const MEMBERSHIP_CATEGORY_LABELS: Record<string, string> = {
  student: "Student",
  associate: "Associate",
  full_professional: "Full / Professional",
  corporate: "Corporate",
};

export const ROLE_LABELS: Record<string, string> = {
  applicant: "Applicant",
  member: "Member",
  reviewer: "Reviewer",
  admin: "Administrator",
  super_admin: "Super Admin",
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: "Pending review",
  more_info_requested: "More info requested",
  approved: "Approved",
  rejected: "Not approved",
};

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  news: "News",
  event: "Event",
  resource: "Resource",
  page: "Page",
};

// Single source of truth for contact details (SRS Section 6.1 / 12 —
// resolving the discrepancy between the two legacy properties).
export const SITE_CONFIG = {
  name: "CSEAG",
  fullName: "Cyber Security Experts Association of Ghana",
  tagline: "A united front of cybersecurity professionals, securing Ghana's digital future.",
  email: "info@cyberexpertgh.org",
  phone: "+233 24 384 1842",
  phoneHref: "+233243841842",
  address: "Block 205, 21 Jordan Street, Madina Estates, Accra, Ghana",
  domain: "cyberexpertgh.org",
  socials: {
    twitter: "https://twitter.com/cyberexpertgh",
    linkedin: "https://linkedin.com/company/cyberexpertgh",
    facebook: "https://facebook.com/cyberexpertgh",
  },
} as const;
