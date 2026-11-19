"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  AdminEmptyState,
  AdminFilterDivider,
  AdminFilterPill,
  AdminListCard,
  AdminListToolbar,
  AdminPageShell,
  AdminStatusBadge,
  adminTableHeadClass,
  adminTableRowClass,
  formatAdminDate,
} from "@/components/admin/AdminListUi";
import { AdminImageUploadField } from "@/components/admin/AdminImageUploadField";
import {
  articlePath,
  contentArticleTypeLabel,
  parseContentArticleType,
  type ContentArticleType,
} from "@/lib/content-article-types";

type Row = {
  id: string;
  type: string;
  slug: string;
  title: string;
  subtitle: string | null;
  coverImageUrl: string | null;
  cardTag: string | null;
  cardGradient: string | null;
  introJson: unknown;
  sectionsJson: unknown;
  faqJson: unknown;
  publishedAt: string;
  sortOrder: number;
  isActive: boolean;
  href: string;
};

type ProductPickForm = { slug: string; caption: string };

type SectionForm = {
  title: string;
  bodyText: string;
  tipsTitle: string;
  tipsText: string;
  productsTitle: string;
  products: ProductPickForm[];
};

type FaqForm = { q: string; a: string };

type FormState = {
  type: ContentArticleType;
  slug: string;
  title: string;
  subtitle: string;
  coverImageUrl: string;
  cardTag: string;
  cardGradient: string;
  introText: string;
  sections: SectionForm[];
  faq: FaqForm[];
  publishedAt: string;
  sortOrder: string;
  isActive: boolean;
};

function emptyProduct(): ProductPickForm {
  return { slug: "", caption: "" };
}

function emptySection(): SectionForm {
  return {
    title: "",
    bodyText: "",
    tipsTitle: "",
    tipsText: "",
    productsTitle: "",
    products: [],
  };
}

function emptyFaq(): FaqForm {
  return { q: "", a: "" };
}

const emptyForm = (): FormState => ({
  type: "GUIDE",
  slug: "",
  title: "",
  subtitle: "",
  coverImageUrl: "",
  cardTag: "",
  cardGradient: "from-zinc-100 to-stone-50",
  introText: "",
  sections: [emptySection()],
  faq: [],
  publishedAt: new Date().toISOString().slice(0, 10),
  sortOrder: "0",
  isActive: true,
});

function asStringArray(raw: unknown): string[] {
  return Array.isArray(raw)
    ? raw.map((v) => String(v)).filter((s) => s.trim().length > 0)
    : [];
}

function parseSections(raw: unknown): SectionForm[] {
  if (!Array.isArray(raw) || raw.length === 0) return [emptySection()];
  return raw.map((item) => {
    const s = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const products = Array.isArray(s.products)
      ? s.products.map((p) => {
          const row =
            p && typeof p === "object" ? (p as Record<string, unknown>) : {};
          return {
            slug: String(row.slug ?? ""),
            caption: typeof row.caption === "string" ? row.caption : "",
          };
        })
      : [];
    return {
      title: String(s.title ?? ""),
      bodyText: asStringArray(s.body).join("\n\n"),
      tipsTitle: typeof s.tipsTitle === "string" ? s.tipsTitle : "",
      tipsText: asStringArray(s.tips).join("\n"),
      productsTitle: typeof s.productsTitle === "string" ? s.productsTitle : "",
      products,
    };
  });
}

function parseFaq(raw: unknown): FaqForm[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const f = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    return {
      q: String(f.q ?? ""),
      a: String(f.a ?? ""),
    };
  });
}

function rowToForm(r: Row): FormState {
  const intro = Array.isArray(r.introJson)
    ? (r.introJson as string[]).join("\n\n")
    : "";
  return {
    type: parseContentArticleType(r.type),
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle ?? "",
    coverImageUrl: r.coverImageUrl ?? "",
    cardTag: r.cardTag ?? "",
    cardGradient: r.cardGradient ?? "",
    introText: intro,
    sections: parseSections(r.sectionsJson),
    faq: parseFaq(r.faqJson),
    publishedAt: r.publishedAt.slice(0, 10),
    sortOrder: String(r.sortOrder),
    isActive: r.isActive,
  };
}

function paragraphsFromText(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function linesFromText(text: string) {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function fieldClass() {
  return "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400";
}

function labelClass() {
  return "mb-1 block text-xs font-medium text-slate-500";
}

const CARD_GRADIENT_PRESETS: {
  value: string;
  label: string;
  from: string;
  to: string;
}[] = [
  {
    value: "from-pink-200 to-rose-100",
    label: "핑크",
    from: "#fbcfe8",
    to: "#ffe4e6",
  },
  {
    value: "from-rose-100 to-orange-50",
    label: "로즈",
    from: "#ffe4e6",
    to: "#fff7ed",
  },
  {
    value: "from-amber-200 to-orange-100",
    label: "앰버",
    from: "#fde68a",
    to: "#ffedd5",
  },
  {
    value: "from-yellow-100 to-amber-50",
    label: "옐로",
    from: "#fef9c3",
    to: "#fffbeb",
  },
  {
    value: "from-orange-100 to-amber-50",
    label: "오렌지",
    from: "#ffedd5",
    to: "#fffbeb",
  },
  {
    value: "from-sky-200 to-blue-100",
    label: "스카이",
    from: "#bae6fd",
    to: "#dbeafe",
  },
  {
    value: "from-blue-100 to-sky-50",
    label: "블루",
    from: "#dbeafe",
    to: "#f0f9ff",
  },
  {
    value: "from-teal-100 to-emerald-50",
    label: "틸",
    from: "#ccfbf1",
    to: "#ecfdf5",
  },
  {
    value: "from-emerald-200 to-green-100",
    label: "그린",
    from: "#a7f3d0",
    to: "#dcfce7",
  },
  {
    value: "from-stone-200 to-zinc-100",
    label: "스톤",
    from: "#e7e5e4",
    to: "#f4f4f5",
  },
  {
    value: "from-stone-100 to-zinc-50",
    label: "라이트 스톤",
    from: "#f5f5f4",
    to: "#fafafa",
  },
  {
    value: "from-zinc-200 to-slate-100",
    label: "그레이",
    from: "#e4e4e7",
    to: "#f1f5f9",
  },
  {
    value: "from-zinc-100 to-stone-50",
    label: "기본",
    from: "#f4f4f5",
    to: "#fafaf9",
  },
];

function gradientPreviewStyle(value: string): CSSProperties {
  const preset = CARD_GRADIENT_PRESETS.find((p) => p.value === value);
  if (preset) {
    return {
      backgroundImage: `linear-gradient(to bottom right, ${preset.from}, ${preset.to})`,
    };
  }
  return { backgroundImage: "linear-gradient(to bottom right, #f4f4f5, #fafaf9)" };
}

function CardGradientPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const selected = value.trim() || CARD_GRADIENT_PRESETS[0]!.value;
  const known = CARD_GRADIENT_PRESETS.some((p) => p.value === selected);

  return (
    <div>
      <span className={labelClass()}>카드 배경색</span>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {CARD_GRADIENT_PRESETS.map((preset) => {
          const isActive = selected === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange(preset.value)}
              className={`overflow-hidden rounded-xl border-2 text-left transition ${
                isActive
                  ? "border-slate-900 ring-2 ring-slate-900/10"
                  : "border-slate-200 hover:border-slate-400"
              }`}
              title={preset.label}
            >
              <span
                className="block h-10 w-full"
                style={gradientPreviewStyle(preset.value)}
              />
              <span className="block truncate bg-white px-1.5 py-1 text-[10px] font-medium text-slate-600">
                {preset.label}
              </span>
            </button>
          );
        })}
        {!known ? (
          <button
            type="button"
            className="overflow-hidden rounded-xl border-2 border-slate-900 ring-2 ring-slate-900/10"
            title="현재 값"
          >
            <span
              className="block h-10 w-full"
              style={gradientPreviewStyle(selected)}
            />
            <span className="block truncate bg-white px-1.5 py-1 text-[10px] font-medium text-slate-600">
              현재
            </span>
          </button>
        ) : null}
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">
        홈/목록 카드에 이미지가 없을 때 쓰는 배경색입니다.
      </p>
    </div>
  );
}

export function AdminContentManager({
  initialArticles,
}: {
  initialArticles: Row[];
}) {
  const [rows, setRows] = useState(initialArticles);
  const [typeFilter, setTypeFilter] = useState<
    "ALL" | ContentArticleType
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL",
  );
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => (typeFilter === "ALL" ? true : r.type === typeFilter))
      .filter((r) => {
        if (statusFilter === "ACTIVE") return r.isActive;
        if (statusFilter === "INACTIVE") return !r.isActive;
        return true;
      })
      .filter((r) => {
        if (!q) return true;
        return (
          r.title.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q) ||
          (r.subtitle?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort(
        (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title),
      );
  }, [rows, typeFilter, statusFilter, query]);

  const reload = async () => {
    const res = await fetch("/api/admin/content-articles");
    const data = (await res.json()) as { articles?: Row[] };
    setRows(data.articles ?? []);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setError(null);
    setOpen(true);
  };

  const openEdit = (r: Row) => {
    setEditId(r.id);
    setForm(rowToForm(r));
    setError(null);
    setOpen(true);
  };

  const updateSection = (index: number, patch: Partial<SectionForm>) => {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    setForm((f) => {
      const next = [...f.sections];
      const target = index + dir;
      if (target < 0 || target >= next.length) return f;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...f, sections: next };
    });
  };

  const removeSection = (index: number) => {
    setForm((f) => ({
      ...f,
      sections:
        f.sections.length <= 1
          ? [emptySection()]
          : f.sections.filter((_, i) => i !== index),
    }));
  };

  const updateProduct = (
    sectionIndex: number,
    productIndex: number,
    patch: Partial<ProductPickForm>,
  ) => {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s, i) => {
        if (i !== sectionIndex) return s;
        return {
          ...s,
          products: s.products.map((p, j) =>
            j === productIndex ? { ...p, ...patch } : p,
          ),
        };
      }),
    }));
  };

  const parsePayload = () => {
    const sectionsJson = form.sections
      .filter((s) => s.title.trim())
      .map((s) => {
        const body = paragraphsFromText(s.bodyText);
        const tips = linesFromText(s.tipsText);
        const products = s.products
          .map((p) => ({
            slug: p.slug.trim(),
            ...(p.caption.trim() ? { caption: p.caption.trim() } : {}),
          }))
          .filter((p) => p.slug);
        return {
          title: s.title.trim(),
          body,
          ...(s.tipsTitle.trim() ? { tipsTitle: s.tipsTitle.trim() } : {}),
          ...(tips.length ? { tips } : {}),
          ...(s.productsTitle.trim()
            ? { productsTitle: s.productsTitle.trim() }
            : {}),
          ...(products.length ? { products } : {}),
        };
      });

    const faqJson = form.faq
      .filter((item) => item.q.trim() && item.a.trim())
      .map((item) => ({ q: item.q.trim(), a: item.a.trim() }));

    const introJson = paragraphsFromText(form.introText);

    return {
      type: form.type,
      slug: form.slug.trim().toLowerCase(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      coverImageUrl: form.coverImageUrl.trim() || null,
      cardTag: form.cardTag.trim() || null,
      cardGradient: form.cardGradient.trim() || null,
      introJson,
      sectionsJson,
      faqJson,
      publishedAt: form.publishedAt
        ? new Date(form.publishedAt).toISOString()
        : new Date().toISOString(),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      if (!form.title.trim() || !form.slug.trim()) {
        throw new Error("제목과 슬러그는 필수입니다.");
      }
      const payload = parsePayload();
      const res = await fetch(
        editId
          ? `/api/admin/content-articles/${editId}`
          : "/api/admin/content-articles",
        {
          method: editId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setOpen(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("이 소개글을 삭제할까요?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/content-articles/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "삭제 실패");
      }
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminPageShell
      title="소개글 관리"
      description="제작 가이드·상황별 굿즈·제작 사례를 등록·수정합니다."
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          새 글
        </button>
      }
    >
      <AdminListCard>
        <AdminListToolbar
          countText={
            <>
              표시{" "}
              <span className="font-semibold text-slate-800">
                {filtered.length}
              </span>{" "}
              / {rows.length}건
            </>
          }
          search={{
            value: query,
            onChange: setQuery,
            placeholder: "제목, 슬러그, 부제 검색",
          }}
          pills={
            <>
              {(
                [
                  ["ALL", "전체"],
                  ["GUIDE", "가이드"],
                  ["IDEA", "상황별 굿즈"],
                  ["CASE", "제작 사례"],
                ] as const
              ).map(([v, label]) => (
                <AdminFilterPill
                  key={v}
                  active={typeFilter === v}
                  onClick={() => setTypeFilter(v)}
                >
                  {label}
                </AdminFilterPill>
              ))}
              <AdminFilterDivider />
              {(
                [
                  ["ALL", "상태 전체"],
                  ["ACTIVE", "노출"],
                  ["INACTIVE", "비활성"],
                ] as const
              ).map(([key, label]) => (
                <AdminFilterPill
                  key={`status-${key}`}
                  active={statusFilter === key}
                  onClick={() => setStatusFilter(key)}
                >
                  {label}
                </AdminFilterPill>
              ))}
            </>
          }
        />

        {filtered.length === 0 ? (
          <AdminEmptyState
            icon={<FileText className="h-12 w-12" />}
            title={
              rows.length === 0
                ? "등록된 글이 없습니다"
                : "검색 결과가 없습니다"
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className={adminTableHeadClass()}>
                    <th className="px-4 py-3">제목</th>
                    <th className="px-3 py-3">유형</th>
                    <th className="px-3 py-3">정렬</th>
                    <th className="px-3 py-3">게시일</th>
                    <th className="px-3 py-3">노출</th>
                    <th className="px-3 py-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((r) => (
                    <tr key={r.id} className={adminTableRowClass()}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{r.title}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                          {articlePath(parseContentArticleType(r.type), r.slug)}
                        </p>
                        {r.subtitle ? (
                          <p className="mt-0.5 max-w-md truncate text-xs text-slate-500">
                            {r.subtitle}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                          {contentArticleTypeLabel(r.type)}
                        </span>
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-600">
                        {r.sortOrder}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-400">
                        {formatAdminDate(r.publishedAt)}
                      </td>
                      <td className="px-3 py-3">
                        <AdminStatusBadge
                          active={r.isActive}
                          activeLabel="노출"
                          inactiveLabel="비활성"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={r.href}
                            target="_blank"
                            className="inline-flex items-center justify-center border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                            title="보기"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEdit(r)}
                            className="inline-flex items-center justify-center border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                            title="수정"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void remove(r.id)}
                            className="inline-flex items-center justify-center border border-slate-200 p-1.5 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                            title="삭제"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-50 xl:hidden">
              {filtered.map((r) => (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                          {contentArticleTypeLabel(r.type)}
                        </span>
                        <AdminStatusBadge
                          active={r.isActive}
                          activeLabel="노출"
                          inactiveLabel="비활성"
                        />
                      </div>
                      <p className="font-medium text-slate-900">{r.title}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                        {articlePath(parseContentArticleType(r.type), r.slug)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        정렬 {r.sortOrder} · {formatAdminDate(r.publishedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Link
                      href={r.href}
                      target="_blank"
                      className="inline-flex items-center gap-1 border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      보기
                    </Link>
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      className="inline-flex items-center gap-1 border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      수정
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void remove(r.id)}
                      className="inline-flex items-center gap-1 border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </AdminListCard>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
            <div className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-slate-900">
                {editId ? "소개글 수정" : "소개글 등록"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                제목·본문·추천 상품·FAQ를 칸에 맞춰 입력하세요.
              </p>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4 sm:px-6">
              <section className="grid gap-3 sm:grid-cols-2">
                <p className="text-sm font-bold text-slate-900 sm:col-span-2">
                  기본 정보
                </p>
                <label>
                  <span className={labelClass()}>유형</span>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        type: parseContentArticleType(e.target.value),
                      }))
                    }
                    className={fieldClass()}
                  >
                    <option value="GUIDE">제작 가이드</option>
                    <option value="IDEA">상황별 굿즈</option>
                    <option value="CASE">제작 사례</option>
                  </select>
                </label>
                <label>
                  <span className={labelClass()}>슬러그 (URL)</span>
                  <input
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, slug: e.target.value }))
                    }
                    className={`${fieldClass()} font-mono`}
                    placeholder="ecobag-guide"
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className={labelClass()}>제목</span>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    className={fieldClass()}
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className={labelClass()}>부제</span>
                  <input
                    value={form.subtitle}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, subtitle: e.target.value }))
                    }
                    className={fieldClass()}
                  />
                </label>
                <div className="sm:col-span-2">
                  <AdminImageUploadField
                    label="커버 이미지"
                    value={form.coverImageUrl}
                    onChange={(coverImageUrl) =>
                      setForm((f) => ({ ...f, coverImageUrl }))
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <CardGradientPicker
                    value={form.cardGradient}
                    onChange={(cardGradient) =>
                      setForm((f) => ({ ...f, cardGradient }))
                    }
                  />
                </div>
                <label className="sm:col-span-2">
                  <span className={labelClass()}>정렬 / 게시일</span>
                  <div className="flex gap-2">
                    <input
                      value={form.sortOrder}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, sortOrder: e.target.value }))
                      }
                      className={`${fieldClass()} w-20`}
                    />
                    <input
                      type="date"
                      value={form.publishedAt}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, publishedAt: e.target.value }))
                      }
                      className={`${fieldClass()} flex-1`}
                    />
                  </div>
                </label>
                <label className="sm:col-span-2">
                  <span className={labelClass()}>
                    소개글 (문단은 빈 줄로 구분)
                  </span>
                  <textarea
                    rows={4}
                    value={form.introText}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, introText: e.target.value }))
                    }
                    className={fieldClass()}
                  />
                </label>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">본문 섹션</p>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        sections: [...f.sections, emptySection()],
                      }))
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    섹션 추가
                  </button>
                </div>

                {form.sections.map((section, si) => (
                  <div
                    key={`section-${si}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-600">
                        섹션 {si + 1}
                      </p>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          aria-label="위로"
                          onClick={() => moveSection(si, -1)}
                          disabled={si === 0}
                          className="rounded-lg border bg-white p-1.5 text-slate-600 disabled:opacity-30"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="아래로"
                          onClick={() => moveSection(si, 1)}
                          disabled={si === form.sections.length - 1}
                          className="rounded-lg border bg-white p-1.5 text-slate-600 disabled:opacity-30"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="섹션 삭제"
                          onClick={() => removeSection(si)}
                          className="rounded-lg border border-rose-200 bg-white p-1.5 text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block">
                        <span className={labelClass()}>섹션 제목</span>
                        <input
                          value={section.title}
                          onChange={(e) =>
                            updateSection(si, { title: e.target.value })
                          }
                          className={fieldClass()}
                          placeholder="1. 어떤 스타일이 잘 맞을까요?"
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass()}>
                          본문 (문단은 빈 줄로 구분)
                        </span>
                        <textarea
                          rows={5}
                          value={section.bodyText}
                          onChange={(e) =>
                            updateSection(si, { bodyText: e.target.value })
                          }
                          className={fieldClass()}
                        />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className={labelClass()}>팁 제목 (선택)</span>
                          <input
                            value={section.tipsTitle}
                            onChange={(e) =>
                              updateSection(si, { tipsTitle: e.target.value })
                            }
                            className={fieldClass()}
                            placeholder="참고"
                          />
                        </label>
                        <label className="block sm:col-span-2">
                          <span className={labelClass()}>
                            팁 목록 (한 줄에 하나)
                          </span>
                          <textarea
                            rows={3}
                            value={section.tipsText}
                            onChange={(e) =>
                              updateSection(si, { tipsText: e.target.value })
                            }
                            className={fieldClass()}
                          />
                        </label>
                      </div>

                      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-600">
                            추천 상품
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              updateSection(si, {
                                products: [
                                  ...section.products,
                                  emptyProduct(),
                                ],
                              })
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            상품 추가
                          </button>
                        </div>
                        <label className="mb-3 block">
                          <span className={labelClass()}>
                            상품 영역 제목 (선택)
                          </span>
                          <input
                            value={section.productsTitle}
                            onChange={(e) =>
                              updateSection(si, {
                                productsTitle: e.target.value,
                              })
                            }
                            className={fieldClass()}
                            placeholder="추천 상품"
                          />
                        </label>
                        {section.products.length === 0 ? (
                          <p className="text-xs text-slate-400">
                            연결된 상품이 없습니다.
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {section.products.map((product, pi) => (
                              <li
                                key={`product-${si}-${pi}`}
                                className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                              >
                                <input
                                  value={product.slug}
                                  onChange={(e) =>
                                    updateProduct(si, pi, {
                                      slug: e.target.value,
                                    })
                                  }
                                  className={fieldClass()}
                                  placeholder="상품 슬러그"
                                />
                                <input
                                  value={product.caption}
                                  onChange={(e) =>
                                    updateProduct(si, pi, {
                                      caption: e.target.value,
                                    })
                                  }
                                  className={fieldClass()}
                                  placeholder="캡션 (선택)"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSection(si, {
                                      products: section.products.filter(
                                        (_, j) => j !== pi,
                                      ),
                                    })
                                  }
                                  className="rounded-xl border border-rose-200 px-3 py-2 text-rose-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">FAQ</p>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        faq: [...f.faq, emptyFaq()],
                      }))
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    질문 추가
                  </button>
                </div>
                {form.faq.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">
                    FAQ가 없습니다. 필요하면 질문을 추가하세요.
                  </p>
                ) : (
                  form.faq.map((item, fi) => (
                    <div
                      key={`faq-${fi}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-600">
                          Q{fi + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              faq: f.faq.filter((_, i) => i !== fi),
                            }))
                          }
                          className="rounded-lg border border-rose-200 bg-white p-1.5 text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <label className="mb-3 block">
                        <span className={labelClass()}>질문</span>
                        <input
                          value={item.q}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              faq: f.faq.map((row, i) =>
                                i === fi ? { ...row, q: e.target.value } : row,
                              ),
                            }))
                          }
                          className={fieldClass()}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass()}>답변</span>
                        <textarea
                          rows={3}
                          value={item.a}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              faq: f.faq.map((row, i) =>
                                i === fi ? { ...row, a: e.target.value } : row,
                              ),
                            }))
                          }
                          className={fieldClass()}
                        />
                      </label>
                    </div>
                  ))
                )}
              </section>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                />
                홈/상세에 노출
              </label>

              {error ? (
                <p className="text-sm text-rose-600">{error}</p>
              ) : null}
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border px-4 py-2.5 text-sm font-medium"
              >
                취소
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                저장
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
