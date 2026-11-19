import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { getSiteSettings, saveSiteSettings } from "@/lib/site-settings";

export async function GET() {
  try {
    await requireAdmin();
    const settings = await getSiteSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as Record<string, unknown>;
    if (!body || typeof body !== "object") {
      return jsonError("설정 값이 올바르지 않습니다.", 400);
    }
    const settings = await saveSiteSettings(body as never);
    revalidatePath("/", "layout");
    return NextResponse.json({ settings });
  } catch (err) {
    return handleApiError(err);
  }
}
