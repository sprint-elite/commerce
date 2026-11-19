"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { User } from "@/types";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400";

interface MyProfileFormProps {
  user: User;
}

export function MyProfileForm({ user: initial }: MyProfileFormProps) {
  const router = useRouter();
  const [user, setUser] = useState(initial);
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [withdrawConfirm, setWithdrawConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveProfile = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = (await res.json()) as { error?: string; user?: User };
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setMessage("회원 정보가 저장되었습니다.");
      if (data.user) {
        setUser(data.user);
        setName(data.user.name);
        setPhone(data.user.phone ?? "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (newPassword !== newPasswordConfirm) {
        throw new Error("새 비밀번호 확인이 일치하지 않습니다.");
      }
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "변경 실패");
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      setMessage("비밀번호가 변경되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "변경 실패");
    } finally {
      setBusy(false);
    }
  };

  const requestVerify = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/verify-email", { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        alreadyVerified?: boolean;
        verifyUrl?: string;
        message?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "요청 실패");
      if (data.alreadyVerified) {
        setMessage("이미 인증된 이메일입니다.");
        setUser((u) => ({
          ...u,
          emailVerifiedAt: u.emailVerifiedAt ?? new Date().toISOString(),
        }));
        return;
      }
      setMessage(
        data.verifyUrl
          ? `인증 링크(테스트): ${data.verifyUrl}`
          : (data.message ?? "인증 메일을 발송했습니다."),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청 실패");
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    if (withdrawConfirm !== "탈퇴") {
      setError('확인을 위해 "탈퇴"를 입력해 주세요.');
      return;
    }
    if (!window.confirm("정말 탈퇴하시겠습니까?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "탈퇴" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "탈퇴 실패");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "탈퇴 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-bold text-zinc-900">포인트 · 인증</h2>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-zinc-500">보유 포인트</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">
              {user.pointsBalance.toLocaleString()} P
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              주문 접수 시 주문 금액의 1%가 적립됩니다.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-zinc-500">이메일 인증</p>
            {user.emailVerifiedAt ? (
              <p className="mt-1 text-sm font-semibold text-emerald-700">
                인증 완료
              </p>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void requestVerify()}
                className="mt-2 inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                인증 메일 받기
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-bold text-zinc-900">기본 정보</h2>
        <p className="mt-1 text-sm text-zinc-500">
          이메일: <span className="font-medium text-zinc-700">{user.email}</span>
          {user.isGuest && (
            <span className="ml-2 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
              게스트
            </span>
          )}
        </p>
        <div className="mt-5 space-y-4">
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs font-medium text-zinc-500">
              이름
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs font-medium text-zinc-500">
              연락처
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="010-0000-0000"
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveProfile()}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            정보 저장
          </button>
        </div>
      </section>

      {!user.isGuest && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-bold text-zinc-900">비밀번호 변경</h2>
          <div className="mt-5 space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                현재 비밀번호
              </span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                autoComplete="current-password"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                새 비밀번호
              </span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
                placeholder="8자 이상"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                새 비밀번호 확인
              </span>
              <input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => void savePassword()}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              비밀번호 변경
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-red-100 bg-white p-6">
        <h2 className="text-base font-bold text-red-700">회원 탈퇴</h2>
        <p className="mt-1 text-sm text-zinc-500">
          탈퇴 시 주문·포인트 등 계정 정보가 비활성화됩니다. 확인을 위해 아래에
          &quot;탈퇴&quot;를 입력하세요.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={withdrawConfirm}
            onChange={(e) => setWithdrawConfirm(e.target.value)}
            placeholder="탈퇴"
            className={inputClass + " max-w-[12rem]"}
          />
          <button
            type="button"
            disabled={busy || withdrawConfirm !== "탈퇴"}
            onClick={() => void withdraw()}
            className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            탈퇴하기
          </button>
        </div>
      </section>

      {message && (
        <p className="break-all rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
