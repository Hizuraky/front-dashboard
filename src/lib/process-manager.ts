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
  var __externalProcessManager: Map<string, Set<number>> | undefined;
}

class ProcessManager {
  private processes: Map<string, ProjectProcess>;
  private externalProcesses: Map<string, Set<number>>;

  constructor() {
    if (!global.__processManager) {
      global.__processManager = new Map();
    }
    if (!global.__externalProcessManager) {
      global.__externalProcessManager = new Map();
    }
    this.processes = global.__processManager;
    this.externalProcesses = global.__externalProcessManager;
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
          if (!this.externalProcesses.has(path)) {
            this.externalProcesses.set(path, new Set());
          }
          this.externalProcesses.get(path)?.add(currentPid);
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
      detached: true,
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

      if (processEntry.logs.length > 2000) {
        processEntry.logs.splice(0, processEntry.logs.length - 2000);
      }
    });

    child.stderr?.on("data", (data) => {
      const line = data.toString();
      processEntry.logs.push(line);
      if (processEntry.logs.length > 2000) {
        processEntry.logs.splice(0, processEntry.logs.length - 2000);
      }
    });

    child.on("exit", (code) => {
      processEntry.status = code === 0 ? "stopped" : "error";
      processEntry.logs.push(`Process exited with code ${code}\n`);
    });

    this.processes.set(id, processEntry);
  }

  async stop(id: string) {
    const entry = this.processes.get(id);
    const externalPids = this.externalProcesses.get(id);

    if (entry && entry.process && entry.status === "running") {
      try {
        if (entry.process.pid) {
          process.kill(-entry.process.pid);
        }
      } catch (e) {
        entry.process.kill();
      }

      await new Promise<void>((resolve) => {
        const onExit = () => {
          resolve();
          entry.process?.off("exit", onExit);
        };
        entry.process?.once("exit", onExit);
        setTimeout(resolve, 2000);
      });
    }

    if (externalPids && externalPids.size > 0) {
      const pids = Array.from(externalPids);
      await Promise.all(
        pids.map(async (pid) => {
          try {
            process.kill(pid);
            await this.waitForPidToExit(pid);
          } catch (e) {
            // Process might be already gone or we lack permission
          }
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.externalProcesses.delete(id);
    }
  }

  private async waitForPidToExit(pid: number) {
    for (let i = 0; i < 50; i++) {
      try {
        process.kill(pid, 0);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch {
        return;
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

    if (
      this.externalProcesses.has(id) &&
      this.externalProcesses.get(id)!.size > 0
    ) {
      return "running";
    }

    return entry ? entry.status : "stopped";
  }
}

export const processManager = new ProcessManager();
