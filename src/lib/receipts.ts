// Dues payment receipt (PDF) — generated on demand from a duesPayments row
// plus the member's profile, never stored. Attached to the payment
// confirmation email (see lib/notifications) and available for on-demand
// download from the member dashboard / admin dues views.
import { readFileSync } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import type { duesPayments } from "@/db/schema";
import { SITE_CONFIG, MEMBERSHIP_CATEGORY_LABELS } from "@/lib/constants";

const NAVY = "#0a0c12";
const ACCENT = "#14b871";
const ACCENT_DARK = "#0f6e5b";
const SLATE = "#475569";
const SLATE_LIGHT = "#94a3b8";
const BORDER = "#e2e8f0";

function ghs(amount: number): string {
  return `GHS ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface ReceiptInput {
  payment: typeof duesPayments.$inferSelect;
  member: {
    fullName: string;
    title: string | null;
    email: string;
    membershipId: string | null;
    membershipCategory: string | null;
  };
  // Running totals for the dues year this payment counts toward, so a
  // partial payment's receipt can show the outstanding balance rather than
  // just this one instalment in isolation.
  duesAmountGhs: number;
  totalPaidGhs: number;
}

export async function generateDuesReceiptPdf(input: ReceiptInput): Promise<Buffer> {
  const { payment, member, duesAmountGhs, totalPaidGhs } = input;
  const balanceGhs = Math.max(duesAmountGhs - totalPaidGhs, 0);
  const isFullyPaid = balanceGhs <= 0;
  const memberName = member.title ? `${member.title} ${member.fullName}` : member.fullName;
  const paidOn = new Date(payment.createdAt).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const receiptNumber =
    payment.paystackReference || `CSEAG-MDR-${payment.year}-${payment.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
  const methodLabel = payment.method === "paystack" ? "Paystack (Card / Mobile Money)" : "Manual (Cash / Bank Transfer)";

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const marginX = 48;
    const contentWidth = pageWidth - marginX * 2;

    // --- Header: logo + association name -----------------------------
    let logoDrawn = false;
    try {
      const logoPath = path.join(process.cwd(), "public", "brand", "cseag-logo.png");
      const logoBuffer = readFileSync(logoPath);
      doc.image(logoBuffer, marginX, 40, { height: 44 });
      logoDrawn = true;
    } catch {
      // Falls back to text-only header below if the asset isn't reachable
      // (e.g. a differently laid-out deploy) — a missing logo shouldn't
      // block the receipt itself from generating.
    }
    const textX = logoDrawn ? marginX + 56 : marginX;
    doc
      .fillColor(NAVY)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(SITE_CONFIG.name, textX, 46);
    doc
      .fillColor(SLATE)
      .font("Helvetica")
      .fontSize(9)
      .text(SITE_CONFIG.fullName, textX, 66, { width: contentWidth - (textX - marginX) });

    // --- Colored bar ----------------------------------------------------
    const barY = 100;
    doc.rect(0, barY, pageWidth, 28).fill(NAVY);
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("MEMBERSHIP DUES RECEIPT", marginX, barY + 9);

    // --- Receipt meta (top right box) ------------------------------------
    const metaY = 150;
    const metaLabelX = marginX;
    const metaValueX = pageWidth - marginX - 200;
    doc.font("Helvetica").fontSize(9).fillColor(SLATE);
    const metaRow = (label: string, value: string, y: number) => {
      doc.text(label, metaLabelX + contentWidth - 260, y, { width: 110 });
      doc.font("Helvetica-Bold").fillColor(NAVY).text(value, metaValueX, y, { width: 200, align: "right" });
      doc.font("Helvetica").fillColor(SLATE);
    };
    metaRow("Receipt Number", receiptNumber, metaY);
    metaRow("Receipt Date", paidOn, metaY + 16);
    metaRow("Payment Method", methodLabel, metaY + 32);

    // --- Member / Association columns -----------------------------------
    const colY = 230;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(SLATE_LIGHT).text("RECEIVED FROM", marginX, colY);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(NAVY)
      .text(memberName, marginX, colY + 14);
    doc.font("Helvetica").fontSize(9).fillColor(SLATE);
    let memberLineY = colY + 32;
    if (member.membershipId) {
      doc.text(`Member ID: ${member.membershipId}`, marginX, memberLineY);
      memberLineY += 14;
    }
    if (member.membershipCategory) {
      doc.text(MEMBERSHIP_CATEGORY_LABELS[member.membershipCategory] || member.membershipCategory, marginX, memberLineY);
      memberLineY += 14;
    }
    doc.text(member.email, marginX, memberLineY);

    const rightColX = marginX + contentWidth / 2;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(SLATE_LIGHT).text("ISSUED BY", rightColX, colY);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(NAVY)
      .text(SITE_CONFIG.fullName, rightColX, colY + 14, { width: contentWidth / 2 });
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(SLATE)
      .text(SITE_CONFIG.address, rightColX, colY + 46, { width: contentWidth / 2 })
      .text(SITE_CONFIG.email, rightColX, colY + 60);

    // --- Line item table --------------------------------------------------
    const tableY = 340;
    doc.rect(marginX, tableY, contentWidth, 22).fill(NAVY);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
    doc.text("DESCRIPTION", marginX + 12, tableY + 7);
    doc.text("PERIOD", marginX + contentWidth - 220, tableY + 7, { width: 100, align: "right" });
    doc.text("AMOUNT", marginX + contentWidth - 110, tableY + 7, { width: 98, align: "right" });

    const rowY = tableY + 22;
    doc.rect(marginX, rowY, contentWidth, 28).fillAndStroke("#ffffff", BORDER);
    doc.fillColor(NAVY).font("Helvetica").fontSize(10);
    doc.text(`${SITE_CONFIG.name} Annual Membership Dues`, marginX + 12, rowY + 9, { width: 260 });
    doc.text(payment.year, marginX + contentWidth - 220, rowY + 9, { width: 100, align: "right" });
    doc.font("Helvetica-Bold").text(ghs(payment.amountGhs), marginX + contentWidth - 110, rowY + 9, { width: 98, align: "right" });

    // --- Totals -------------------------------------------------------
    const totalsY = rowY + 46;
    const totalsLabelX = marginX + contentWidth - 260;
    const totalsValueX = marginX + contentWidth - 110;
    doc.font("Helvetica").fontSize(9).fillColor(SLATE);
    doc.text("Amount paid this instalment", totalsLabelX, totalsY, { width: 150 });
    doc.font("Helvetica-Bold").fillColor(NAVY).text(ghs(payment.amountGhs), totalsValueX, totalsY, { width: 98, align: "right" });

    doc.font("Helvetica").fillColor(SLATE).text("Total paid for " + payment.year, totalsLabelX, totalsY + 16, { width: 150 });
    doc.font("Helvetica-Bold").fillColor(NAVY).text(ghs(totalPaidGhs), totalsValueX, totalsY + 16, { width: 98, align: "right" });

    let statusY = totalsY + 40;
    if (!isFullyPaid) {
      doc.font("Helvetica").fillColor(SLATE).text("Balance remaining", totalsLabelX, statusY, { width: 150 });
      doc.font("Helvetica-Bold").fillColor("#b45309").text(ghs(balanceGhs), totalsValueX, statusY, { width: 98, align: "right" });
      statusY += 24;
    }

    // --- Approval / status badge (stands in for a signature — this is a
    // system-generated receipt, verified automatically against the payment
    // record rather than hand-signed) -----------------------------------
    const badgeLabel = isFullyPaid ? "PAID IN FULL" : "PARTIAL PAYMENT RECEIVED";
    const badgeColor = isFullyPaid ? ACCENT_DARK : "#b45309";
    doc.font("Helvetica-Bold").fontSize(10);
    const badgeWidth = doc.widthOfString(badgeLabel) + 28;
    doc
      .roundedRect(marginX, statusY, badgeWidth, 22, 11)
      .fill(isFullyPaid ? "#ecfdf6" : "#fffbeb");
    doc
      .fillColor(badgeColor)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(badgeLabel, marginX + 14, statusY + 6);
    doc
      .fillColor(SLATE_LIGHT)
      .font("Helvetica")
      .fontSize(8)
      .text("Verified automatically against the association's payment records — no signature required.", marginX, statusY + 30, {
        width: contentWidth,
      });

    // --- Footer -----------------------------------------------------------
    const footerY = doc.page.height - 100;
    doc.moveTo(marginX, footerY).lineTo(pageWidth - marginX, footerY).strokeColor(BORDER).stroke();
    const footerLine1 = `${SITE_CONFIG.fullName} · ${SITE_CONFIG.address}`;
    const footerLine2 = `${SITE_CONFIG.email} · ${SITE_CONFIG.phone}`;
    doc.font("Helvetica").fontSize(8).fillColor(SLATE_LIGHT);
    const line1Height = doc.heightOfString(footerLine1, { width: contentWidth, align: "center" });
    doc.text(footerLine1, marginX, footerY + 14, { width: contentWidth, align: "center" });
    doc.text(footerLine2, marginX, footerY + 14 + line1Height + 3, { width: contentWidth, align: "center" });
    const line2Height = doc.heightOfString(footerLine2, { width: contentWidth, align: "center" });
    doc.text("Thank you for being a member of CSEAG.", marginX, footerY + 14 + line1Height + 3 + line2Height + 8, {
      width: contentWidth,
      align: "center",
    });

    doc.end();
  });
}
