import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchSuggestions } from "@/lib/server/music/innertube";

const schema = z.object({ q: z.string().min(1).max(200) });

export async function GET(req: NextRequest) {
  const parsed = schema.safeParse({
    q: req.nextUrl.searchParams.get("q"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  try {
    const suggestions = await searchSuggestions(parsed.data.q);
    return NextResponse.json({ success: true, data: suggestions });
  } catch (err) {
    console.error("[api/music/suggestions]", err);
    return NextResponse.json(
      { success: false, error: { code: "SUGGESTIONS_FAILED", message: "Suggestions failed" } },
      { status: 502 }
    );
  }
}
