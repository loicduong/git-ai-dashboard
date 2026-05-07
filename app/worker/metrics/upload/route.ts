import { NextResponse } from "next/server";

import { parseMetricsUpload } from "@/lib/git-ai/metrics";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = parseMetricsUpload(payload, new Date());
  const accepted = parsed.rows.length;

  if (accepted === 0) {
    return NextResponse.json(
      { error: "No valid metrics rows", accepted: 0, rejected: parsed.rejected },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("metrics").insert(parsed.rows);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown Supabase error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ accepted, rejected: parsed.rejected });
}
