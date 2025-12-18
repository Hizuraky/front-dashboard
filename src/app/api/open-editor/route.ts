import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { path, command } = await request.json();

    if (!path || !command) {
      return NextResponse.json(
        { error: "Path and command are required" },
        { status: 400 },
      );
    }

    // Execute the command in the project's directory
    await execAsync(command, { cwd: path });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to open editor:", error);
    return NextResponse.json(
      { error: "Failed to open editor" },
      { status: 500 },
    );
  }
}
