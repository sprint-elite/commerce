"use client";

import { useCallback, useState } from "react";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";

export async function uploadAdminImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/admin/uploads", { method: "POST", body });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "업로드 실패");
  }
  return data.url;
}

const ACCEPT = "image/png,image/jpeg,image/webp";

function pickImageFile(fileList: FileList | null | undefined): File | null {
  const file = fileList?.[0];
  if (!file) return null;
  if (!file.type.startsWith("image/")) return null;
  return file;
}

export function AdminImageUploadField({
  label,
  value,
  onChange,
  allowClear = true,
  variant = "inline",
}: {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  allowClear?: boolean;
  /** dropzone: 넓은 미리보기·드래그 영역 (배너 등) */
  variant?: "inline" | "dropzone";
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        onChange(await uploadAdminImage(file));
      } catch (err) {
        setError(err instanceof Error ? err.message : "업로드 실패");
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (uploading) return;
      const file = pickImageFile(e.dataTransfer.files);
      if (file) void upload(file);
    },
    [upload, uploading],
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const fileInput = (
    id: string,
    className: string,
    inputLabel: React.ReactNode,
  ) => (
  <label
      htmlFor={id}
      className={className}
    >
      {inputLabel}
      <input
        id={id}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={uploading}
        onChange={(e) => {
          const file = pickImageFile(e.target.files);
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
    </label>
  );

  if (variant === "dropzone") {
    const zoneId = "admin-image-dropzone-input";
    return (
      <div className="min-w-0 text-sm">
        {label ? (
          <span className="mb-1.5 block text-xs font-medium text-slate-500">
            {label}
          </span>
        ) : null}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
            dragOver
              ? "border-slate-900 bg-slate-50"
              : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
          } ${uploading ? "pointer-events-none opacity-70" : ""}`}
        >
          {value ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt=""
                className="max-h-52 w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                {fileInput(
                  zoneId,
                  "cursor-pointer rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow",
                  uploading ? (
                    <>
                      <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />
                      올리는 중
                    </>
                  ) : (
                    "이미지 바꾸기"
                  ),
                )}
                {allowClear ? (
                  <button
                    type="button"
                    onClick={() => onChange("")}
                    className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow"
                  >
                    제거
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              {uploading ? (
                <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
              ) : (
                <Upload className="h-10 w-10 text-slate-300" />
              )}
              <p className="mt-3 text-sm font-medium text-slate-700">
                {dragOver
                  ? "여기에 놓으세요"
                  : uploading
                    ? "업로드 중…"
                    : "이미지를 끌어다 놓거나 선택하세요"}
              </p>
              <p className="mt-1 text-xs text-slate-400">PNG, JPG, WEBP · 최대 8MB</p>
              {!uploading &&
                fileInput(
                  zoneId,
                  "mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50",
                  <>
                    <ImagePlus className="h-3.5 w-3.5" />
                    파일 선택
                  </>,
                )}
            </div>
          )}
        </div>
        {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }

  const inlineId = "admin-image-inline-input";
  return (
    <div
      className="min-w-0 text-sm"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      {label ? (
        <span className="mb-1 block text-xs text-slate-500">{label}</span>
      ) : null}
      <div
        className={`flex items-center gap-3 rounded-lg p-1 transition-colors ${
          dragOver ? "bg-slate-100 ring-2 ring-slate-300 ring-inset" : ""
        }`}
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus className="h-4 w-4 text-slate-300" />
          )}
        </div>
        <div className="min-w-0">
          {fileInput(
            inlineId,
            "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50",
            uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                올리는 중
              </>
            ) : (
              <>
                <ImagePlus className="h-3.5 w-3.5" />
                {value ? "파일 바꾸기" : "파일 업로드"}
              </>
            ),
          )}
          <span className="ml-2 text-[10px] text-slate-400">또는 끌어다 놓기</span>
          {allowClear && value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="ml-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-600"
            >
              <X className="h-3 w-3" />
              제거
            </button>
          ) : null}
          {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
