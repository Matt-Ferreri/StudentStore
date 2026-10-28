import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { HeaderFallback } from "@/components/brand-header";
import { SiteHeader } from "@/components/site-header";
import { getCampus } from "@/lib/campuses";

export const instant = false;

export async function generateMetadata({
  params,
}: LayoutProps<"/[campus]">): Promise<Metadata> {
  const { campus: slug } = await params;
  const result = await getCampus(slug);
  if ("configError" in result || !result.campus) {
    return { title: "StudentStore" };
  }

  return {
    title: {
      absolute: result.campus.brandName,
      template: `%s · ${result.campus.brandName}`,
    },
    description: `Buy and sell with other students at ${result.campus.name}.`,
  };
}

export default async function CampusLayout({
  children,
  params,
}: LayoutProps<"/[campus]">) {
  const { campus: slug } = await params;
  const result = await getCampus(slug);
  if ("configError" in result) {
    return (
      <>
        <HeaderFallback />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      </>
    );
  }

  if (!result.campus) {
    notFound();
  }

  const campus = result.campus;

  return (
    <>
      <Suspense
        fallback={
          <HeaderFallback title={campus.brandName} subtitle={campus.name} />
        }
      >
        <SiteHeader campus={campus} />
      </Suspense>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
