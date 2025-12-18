import { NextResponse } from "next/server";
import { getLocalBranches } from "@/lib/git";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "Project path is required" },
      { status: 400 }
    );
  }

  try {
    const branches = await getLocalBranches(path);
    return NextResponse.json({ branches });
  } catch (error) {
    console.error("Failed to get branches:", error);
    return NextResponse.json(
      { error: "Failed to get branches" },
      { status: 500 }
    );
  }
}
