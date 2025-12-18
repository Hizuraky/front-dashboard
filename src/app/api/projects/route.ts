import { NextResponse } from "next/server";
import { readdir, stat, readFile } from "fs/promises";
import { join, basename } from "path";
import { processManager } from "@/lib/process-manager";
import { getCurrentBranch } from "@/lib/git";

const WORKSPACE_ROOT = "/Users/kazuki/WorkSpace/0plus";
const PROJECTS_CONFIG_PATH = join(process.cwd(), "projects.json");

export async function GET() {
  try {
    const projects = [];
    const projectPaths: { path: string; command: string; name?: string }[] = [];

    try {
      const configContent = await readFile(PROJECTS_CONFIG_PATH, "utf-8");
      const rawConfig = JSON.parse(configContent);

      if (Array.isArray(rawConfig)) {
        for (const item of rawConfig) {
          if (typeof item === "string") {
            projectPaths.push({ path: item, command: "yarn dev" });
          } else if (typeof item === "object" && item.path) {
            projectPaths.push({
              path: item.path,
              command: item.command || "yarn dev",
              name: item.name,
            });
          }
        }
      }
    } catch {
      const entries = await readdir(WORKSPACE_ROOT);
      for (const name of entries) {
        if (name.startsWith(".") || name === "dashboard") continue;
        projectPaths.push({
          path: join(WORKSPACE_ROOT, name),
          command: "yarn dev",
        });
      }
    }

    for (const config of projectPaths) {
      try {
        const stats = await stat(config.path);
        if (stats.isDirectory()) {
          await stat(join(config.path, "package.json"));

          const name = config.name || basename(config.path);
          const status = processManager.getStatus(config.path);

          projects.push({
            name,
            path: config.path,
            status,
            command: config.command,
            currentBranch: await getCurrentBranch(config.path),
          });
        }
      } catch {}
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Failed to scan projects:", error);
    return NextResponse.json(
      { error: "Failed to scan projects" },
      { status: 500 },
    );
  }
}
