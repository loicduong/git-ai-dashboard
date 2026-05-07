import { NextResponse } from "next/server";

import { parseMetricsUpload } from "@/lib/git-ai/metrics";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function logMetricsUpload(
  status: "accepted" | "ignored" | "rejected" | "failed",
  details: Record<string, unknown>,
) {
  console.info("[git-ai metrics upload]", {
    status,
    ...details,
  });
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    logMetricsUpload("rejected", { reason: "invalid_json" });
    return NextResponse.json({ error: "Invalid JSON payload", errors: [] }, { status: 400 });
  }

  const parsed = parseMetricsUpload(payload, new Date());
  const accepted = parsed.rows.length;

  // Case: No metrics were accepted
  if (accepted === 0) {
    if (parsed.unsupported > 0 && parsed.rejected === 0) {
      logMetricsUpload("ignored", {
        accepted: 0,
        rejected: 0,
        unsupported: parsed.unsupported,
      });

      return NextResponse.json({
        errors: [],
        accepted: 0,
        rejected: 0,
        unsupported: parsed.unsupported,
        message: "No committed metrics rows in upload",
      });
    }

    logMetricsUpload("rejected", {
      accepted: 0,
      rejected: parsed.rejected,
      unsupported: parsed.unsupported,
      reason: "no_valid_metrics_rows",
    });

    return NextResponse.json(
      {
        error: "No valid metrics rows",
        errors: [],
        accepted: 0,
        rejected: parsed.rejected,
        unsupported: parsed.unsupported,
      },
      { status: 400 },
    );
  }

  // Case: Success, try to insert into database
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("metrics").insert(parsed.rows);

    if (error) {
      logMetricsUpload("failed", {
        accepted,
        rejected: parsed.rejected,
        unsupported: parsed.unsupported,
        reason: error.message,
      });

      return NextResponse.json({ error: error.message, errors: [] }, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Supabase error";
    logMetricsUpload("failed", {
      accepted,
      rejected: parsed.rejected,
      unsupported: parsed.unsupported,
      reason: message,
    });

    return NextResponse.json(
      { error: message, errors: [] },
      { status: 500 },
    );
  }

  // Final Success Response
  logMetricsUpload("accepted", { 
    accepted, 
    rejected: parsed.rejected, 
    unsupported: parsed.unsupported 
  });

  return NextResponse.json({
    errors: [],
    accepted,
    rejected: parsed.rejected,
    unsupported: parsed.unsupported,
  });
}
