import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function getCurrentBranch(cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync("git rev-parse --abbrev-ref HEAD", {
      cwd,
    });
    return stdout.trim();
  } catch (error) {
    // Not a git repository or other error
    return null;
  }
}

export async function getLocalBranches(cwd: string): Promise<string[]> {
  try {
    // Get list of local branches
    // --format="%(refname:short)" gives clean branch names
    const { stdout } = await execAsync(
      'git branch --list --format="%(refname:short)"',
      { cwd }
    );
    return stdout
      .split("\n")
      .map((b) => b.trim())
      .filter((b) => b.length > 0);
  } catch (error) {
    return [];
  }
}

export async function checkoutBranch(
  cwd: string,
  branch: string
): Promise<void> {
  try {
    await execAsync(`git checkout ${branch}`, { cwd });
  } catch (error: any) {
    // Capture stderr for better error messages
    const errorMessage = error.stderr || error.message || "Unknown error";
    throw new Error(`Failed to checkout branch: ${errorMessage}`);
  }
}

export async function pullChanges(cwd: string): Promise<string> {
  try {
    const { stdout } = await execAsync("git pull", { cwd });
    return stdout;
  } catch (error: any) {
    const errorMessage = error.stderr || error.message || "Unknown error";
    throw new Error(`Failed to pull changes: ${errorMessage}`);
  }
}
