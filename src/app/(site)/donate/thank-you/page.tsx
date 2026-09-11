import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { IconHeart, IconXCircle, IconArrowRight } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Thank You" };

export default async function DonateThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const success = status === "success";

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <span
        className={
          success
            ? "flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 text-accent-600"
            : "flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500"
        }
      >
        {success ? <IconHeart className="h-8 w-8" /> : <IconXCircle className="h-8 w-8" />}
      </span>

      {success ? (
        <>
          <h1 className="font-serif-display mt-6 text-3xl text-navy-900">Thank you for your support</h1>
          <p className="mt-3 text-slate-600">
            Your donation has been received. It goes straight toward CSEAG&rsquo;s work training the public,
            supporting incident response, and building a safer digital Ghana — we&rsquo;re grateful you&rsquo;re part
            of that effort.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-serif-display mt-6 text-3xl text-navy-900">Donation not completed</h1>
          <p className="mt-3 text-slate-600">
            Your payment didn&rsquo;t go through, or was cancelled before it finished. No amount was charged. Please
            try again — or reach out if you keep running into trouble.
          </p>
        </>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <ButtonLink href="/" size="lg">
          Back to homepage
        </ButtonLink>
        {!success && (
          <Link href="/contact" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-700 hover:text-accent-800">
            Contact us <IconArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
