import { NextResponse } from "next/server";

import { parseCasUpload } from "@/lib/git-ai/cas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function logCasUpload(
  status: "accepted" | "rejected" | "failed",
  details: Record<string, unknown>,
) {
  console.info("[git-ai cas upload]", {
    status,
    ...details,
  });
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    logCasUpload("rejected", { reason: "invalid_json" });
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = parseCasUpload(payload);
  const accepted = parsed.rows.length;

  if (accepted === 0) {
    logCasUpload("rejected", {
      accepted: 0,
      rejected: parsed.rejected,
      reason: "no_valid_cas_objects",
    });

    return NextResponse.json(
      { error: "No valid CAS objects", accepted: 0, rejected: parsed.rejected },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("cas_objects").upsert(parsed.rows, {
      onConflict: "hash",
    });

    if (error) {
      logCasUpload("failed", {
        accepted,
        rejected: parsed.rejected,
        reason: error.message,
      });

      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (error) {
    logCasUpload("failed", {
      accepted,
      rejected: parsed.rejected,
      reason: error instanceof Error ? error.message : "Unknown Supabase error",
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown Supabase error" },
      { status: 500 },
    );
  }

  logCasUpload("accepted", { accepted, rejected: parsed.rejected });

  return NextResponse.json({
    accepted,
    rejected: parsed.rejected,
    results: parsed.rows.map((row) => ({
      hash: row.hash,
      status: "ok",
    })),
    success_count: accepted,
    failure_count: parsed.rejected,
  });
}
