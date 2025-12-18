import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function getCurrentBranch(cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync("git rev-parse --abbrev-ref HEAD", {
      cwd,
    });
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function getLocalBranches(cwd: string): Promise<string[]> {
  try {
    const { stdout } = await execAsync(
      'git branch --list --format="%(refname:short)"',
      { cwd },
    );
    return stdout
      .split("\n")
      .map((b) => b.trim())
      .filter((b) => b.length > 0);
  } catch {
    return [];
  }
}

export async function checkoutBranch(
  cwd: string,
  branch: string,
): Promise<void> {
  try {
    await execAsync(`git checkout ${branch}`, { cwd });
  } catch (error: unknown) {
    const err = error as { stderr?: string; message?: string };
    const errorMessage = err.stderr || err.message || "Unknown error";
    throw new Error(`Failed to checkout branch: ${errorMessage}`);
  }
}

export async function pullChanges(cwd: string): Promise<string> {
  try {
    const { stdout } = await execAsync("git pull", { cwd });
    return stdout;
  } catch (error: unknown) {
    const err = error as { stderr?: string; message?: string };
    const errorMessage = err.stderr || err.message || "Unknown error";
    throw new Error(`Failed to pull changes: ${errorMessage}`);
  }
}
