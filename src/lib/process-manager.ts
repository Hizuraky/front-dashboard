import { ChildProcess, spawn } from "child_process";

type ProjectStatus = "running" | "stopped" | "error";

export type ProjectProcess = {
  id: string;
  process: ChildProcess;
  logs: string[];
  status: ProjectStatus;
  command: string;
};

declare global {
  var __processManager: Map<string, ProjectProcess> | undefined;
}

class ProcessManager {
  private processes: Map<string, ProjectProcess>;

  constructor() {
    if (!global.__processManager) {
      global.__processManager = new Map();
    }
    this.processes = global.__processManager;
  }

  start(id: string, command: string, cwd: string) {
    if (this.processes.has(id)) {
      const existing = this.processes.get(id);
      if (existing && existing.process.exitCode === null) {
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
    if (!entry) return;

    entry.process.kill();
  }

  getLogs(id: string) {
    return this.processes.get(id)?.logs || [];
  }

  getStatus(id: string): ProjectStatus {
    const entry = this.processes.get(id);
    if (!entry) return "stopped";
    return entry.process.exitCode === null ? "running" : entry.status;
  }
}

export const processManager = new ProcessManager();
