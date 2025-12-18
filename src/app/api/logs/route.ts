import { NextRequest, NextResponse } from "next/server";
import { processManager } from "@/lib/process-manager";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  const logs = processManager.getLogs(path);
  return NextResponse.json({ logs });
}
