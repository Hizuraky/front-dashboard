import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import { join } from "path";
import { processManager } from "@/lib/process-manager";

const WORKSPACE_ROOT = "/Users/kazuki/WorkSpace/0plus";

export async function GET() {
  try {
    const entries = await readdir(WORKSPACE_ROOT);
    const projects = [];

    for (const name of entries) {
      if (name.startsWith(".") || name === "dashboard") continue; // Skip hidden and self

      const path = join(WORKSPACE_ROOT, name);
      const stats = await stat(path);

      if (stats.isDirectory()) {
        // Check if it has package.json to be a valid project
        try {
          await stat(join(path, "package.json"));
          const status = processManager.getStatus(path);
          projects.push({
            name,
            path,
            status,
          });
        } catch {
          // Not a node project
        }
      }
    }

    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to scan projects" },
      { status: 500 }
    );
  }
}
