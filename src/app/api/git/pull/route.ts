import { NextResponse } from "next/server";
import { pullChanges } from "@/lib/git";

export async function POST(request: Request) {
  try {
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json(
        { error: "Project path is required" },
        { status: 400 },
      );
    }

    const message = await pullChanges(path);
    return NextResponse.json({ success: true, message });
  } catch (error: unknown) {
    console.error("Failed to pull changes:", error);
    const err = error as { message?: string };
    return NextResponse.json(
      { error: err.message || "Failed to pull changes" },
      { status: 500 },
    );
  }
}
