"use client";

import { useState } from "react";
import {
  Play,
  Square,
  FileText,
  Loader2,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LogViewer } from "./log-viewer";
import { toast } from "sonner";

type ProjectStatus = "running" | "stopped" | "error";

interface Project {
  name: string;
  path: string;
  status: ProjectStatus;
  command?: string;
}

interface ProjectCardProps {
  project: Project;
  onRefresh: () => void;
}

export function ProjectCard({ project, onRefresh }: ProjectCardProps) {
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      // Use the configured command or default to "yarn dev"
      const command = project.command || "yarn dev";
      const res = await fetch("/api/process", {
        method: "POST",
        body: JSON.stringify({ path: project.path, command }),
      });
      if (!res.ok) throw new Error("Failed to start");
      toast.success(`Started ${project.name}`);
      onRefresh();
    } catch (e) {
      toast.error("Failed to start project");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/process?path=${encodeURIComponent(project.path)}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("Failed to stop");
      toast.success(`Stopped ${project.name}`);
      onRefresh();
    } catch (e) {
      toast.error("Failed to stop project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{project.name}</CardTitle>
        <Badge variant={project.status === "running" ? "default" : "secondary"}>
          {project.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div
          className="text-xs text-muted-foreground truncate"
          title={project.path}
        >
          {project.path}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        {project.status === "running" ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleStop}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Square className="mr-2 h-4 w-4" />
            )}
            Stop
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={handleStart}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Start
          </Button>
        )}

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Terminal className="mr-2 h-4 w-4" />
              Logs
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[800px] sm:max-w-[800px] flex flex-col h-full">
            <SheetHeader>
              <SheetTitle>{project.name} Logs</SheetTitle>
              <SheetDescription>Live output from the process.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 mt-4 overflow-hidden relative">
              <LogViewer path={project.path} />
            </div>
          </SheetContent>
        </Sheet>
      </CardFooter>
    </Card>
  );
}
