import { ChildProcess, spawn, exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

type ProjectStatus = "running" | "stopped" | "error";

export type ProjectProcess = {
  id: string;
  process?: ChildProcess;
  logs: string[];
  status: ProjectStatus;
  command: string;
  isExternal?: boolean;
};

declare global {
  var __processManager: Map<string, ProjectProcess> | undefined;
}

class ProcessManager {
  private processes: Map<string, ProjectProcess>;
  private externalProcesses: Map<string, number>;

  constructor() {
    if (!global.__processManager) {
      global.__processManager = new Map();
    }
    this.processes = global.__processManager;
    this.externalProcesses = new Map();
  }

  async scanRunningProcesses() {
    try {
      const { stdout } = await execAsync("lsof -a -c node -d cwd -F n");
      const lines = stdout.split("\n");

      this.externalProcesses.clear();

      let currentPid: number | null = null;
      for (const line of lines) {
        if (line.startsWith("p")) {
          currentPid = parseInt(line.substring(1), 10);
        } else if (line.startsWith("n") && currentPid) {
          const path = line.substring(1);
          this.externalProcesses.set(path, currentPid);
        }
      }
    } catch {}
  }

  start(id: string, command: string, cwd: string) {
    if (this.processes.has(id)) {
      const existing = this.processes.get(id);
      if (existing && existing.status === "running") {
        throw new Error("Process is already running");
      }
    }

    const [cmd, ...args] = command.split(" ");

    const child = spawn(cmd, args, {
      cwd,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const processEntry: ProjectProcess = {
      id,
      process: child,
      logs: [],
      status: "running",
      command,
      isExternal: false,
    };

    child.stdout?.on("data", (data) => {
      const line = data.toString();
      processEntry.logs.push(line);

      if (processEntry.logs.length > 1000) processEntry.logs.shift();
    });

    child.stderr?.on("data", (data) => {
      const line = data.toString();
      processEntry.logs.push(line);
      if (processEntry.logs.length > 1000) processEntry.logs.shift();
    });

    child.on("exit", (code) => {
      processEntry.status = code === 0 ? "stopped" : "error";
      processEntry.logs.push(`Process exited with code ${code}\n`);
    });

    this.processes.set(id, processEntry);
  }

  stop(id: string) {
    const entry = this.processes.get(id);
    if (entry && entry.process) {
      entry.process.kill();
      return;
    }

    // Handle external process
    const pid = this.externalProcesses.get(id);
    if (pid) {
      try {
        process.kill(pid);
        this.externalProcesses.delete(id);
        // Force a scan to update status of other potentially related processes
        // But since this is sync/fire-and-forget from the API perspective,
        // the next status polling/refresh should catch the update after a re-scan.
      } catch (e) {
        console.error(`Failed to kill external process ${pid}:`, e);
      }
    }
  }

  getLogs(id: string) {
    const entry = this.processes.get(id);
    if (entry) return entry.logs;

    if (this.externalProcesses.has(id)) {
      return [
        "Process detected running externally (Terminal/IDE).",
        "Logs are not available for external processes.",
        "Logs are only captured for processes started from this dashboard.",
      ];
    }

    return [];
  }

  getStatus(id: string): ProjectStatus {
    const entry = this.processes.get(id);
    if (entry && entry.status === "running") {
      return "running";
    }

    if (this.externalProcesses.has(id)) {
      return "running";
    }

    return entry ? entry.status : "stopped";
  }
}

export const processManager = new ProcessManager();
