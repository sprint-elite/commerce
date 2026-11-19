import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  /** 외부 URL — 새 창에서 열기 */
  linkExternal?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = "더보기",
  linkExternal = false,
}: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        )}
      </div>
      {href &&
        (linkExternal ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
          >
            {linkLabel}
            <ChevronRight className="h-4 w-4" />
          </a>
        ) : (
          <Link
            href={href}
            className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
          >
            {linkLabel}
            <ChevronRight className="h-4 w-4" />
          </Link>
        ))}
    </div>
  );
}
