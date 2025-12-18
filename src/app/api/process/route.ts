import { NextRequest, NextResponse } from "next/server";
import { processManager } from "@/lib/process-manager";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, command } = body;

    if (!path || !command) {
      return NextResponse.json(
        { error: "Missing path or command" },
        { status: 400 }
      );
    }

    processManager.start(path, command, path);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to start process" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    processManager.stop(path);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to stop process" },
      { status: 500 }
    );
  }
}
