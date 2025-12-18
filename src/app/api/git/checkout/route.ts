import { NextResponse } from "next/server";
import { checkoutBranch } from "@/lib/git";

export async function POST(request: Request) {
  try {
    const { path, branch } = await request.json();

    if (!path || !branch) {
      return NextResponse.json(
        { error: "Project path and branch path are required" },
        { status: 400 }
      );
    }

    await checkoutBranch(path, branch);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to checkout branch:", error);
    return NextResponse.json(
      { error: error.message || "Failed to checkout branch" },
      { status: 500 }
    );
  }
}
