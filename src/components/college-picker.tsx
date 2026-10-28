"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export function CollegePicker({
  colleges,
}: {
  colleges: { slug: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return colleges;
    }

    return colleges.filter((college) =>
      college.name.toLowerCase().includes(needle),
    );
  }, [colleges, query]);

  return (
    <div className="space-y-3">
      <label className="block space-y-1">
        <span className="text-sm font-medium text-ink">Find your college</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search colleges"
          className="w-full rounded-xl border border-sage bg-cream px-3 py-2 text-sm text-ink outline-none placeholder:text-sage focus:border-burgundy"
        />
      </label>
      <ul className="max-h-80 overflow-y-scroll rounded-2xl border border-sage bg-cream">
        {filtered.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-ink">
            No colleges match that search.
          </li>
        ) : (
          filtered.map((college) => (
            <li key={college.slug} className="border-b border-sage last:border-b-0">
              <Link
                href={`/${college.slug}/login`}
                className="block px-4 py-3 font-medium text-ink hover:bg-sage/40"
              >
                {college.name}
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
