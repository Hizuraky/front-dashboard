export type ProjectStatus = "running" | "stopped" | "error";

export interface ProjectEnvironment {
  name: string;
  url: string;
}

export interface Project {
  name: string;
  path: string;
  status: ProjectStatus;
  command?: string;
  currentBranch?: string;
  codeCommand?: string;
  environments?: ProjectEnvironment[];
  type?: "repository" | "site";
}
