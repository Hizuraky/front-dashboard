"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Square,
  Loader2,
  Terminal,
  GitBranch,
  Check,
  Download,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { ScrollArea } from "@/components/ui/scroll-area";

type ProjectStatus = "running" | "stopped" | "error";

interface Project {
  name: string;
  path: string;
  status: ProjectStatus;
  command?: string;
  currentBranch?: string;
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
      const command = project.command || "yarn dev";
      const res = await fetch("/api/process", {
        method: "POST",
        body: JSON.stringify({ path: project.path, command }),
      });
      if (!res.ok) throw new Error("Failed to start");
      toast.success(`Started ${project.name}`);
      onRefresh();
    } catch {
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
        },
      );
      if (!res.ok) throw new Error("Failed to stop");
      toast.success(`Stopped ${project.name}`);
      onRefresh();
    } catch {
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
          <SheetContent className="w-[90vw] max-w-[90vw] min-w-[90vw] flex flex-col h-full">
            <SheetHeader>
              <SheetTitle>{project.name} Logs</SheetTitle>
            </SheetHeader>
            <div className="mt-0 overflow-hidden relative">
              <LogViewer path={project.path} />
            </div>
          </SheetContent>
        </Sheet>

        {project.currentBranch && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="w-full px-2">
                <GitBranch className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate max-w-[80px] sm:max-w-[120px]">
                  {project.currentBranch}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Git Branches</SheetTitle>
                <SheetDescription>
                  Switch between local branches for {project.name}.
                </SheetDescription>
              </SheetHeader>
              <BranchList project={project} onCheckout={onRefresh} />
            </SheetContent>
          </Sheet>
        )}
      </CardFooter>
    </Card>
  );
}

function BranchList({
  project,
  onCheckout,
}: {
  project: Project;
  onCheckout: () => void;
}) {
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [pullLoading, setPullLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBranches = branches.filter((branch) =>
    branch.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    const fetchBranches = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/git/branches?path=${encodeURIComponent(project.path)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setBranches(data.branches);
        }
      } catch {
        toast.error("Failed to load branches");
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [project.path]);

  const handlePull = async () => {
    setPullLoading(true);
    try {
      const res = await fetch("/api/git/pull", {
        method: "POST",
        body: JSON.stringify({ path: project.path }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to pull");
      }

      toast.success(data.message || "Successfully pulled latest changes");
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message);
    } finally {
      setPullLoading(false);
    }
  };

  const handleCheckout = async (branch: string) => {
    if (branch === project.currentBranch) return;

    setCheckoutLoading(branch);
    try {
      const res = await fetch("/api/git/checkout", {
        method: "POST",
        body: JSON.stringify({ path: project.path, branch }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to checkout");
      }

      toast.success(`Switched to ${branch}`);
      onCheckout();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col h-[calc(100vh-120px)]">
      <Button
        variant="outline"
        className="w-full mb-4 shrink-0"
        onClick={handlePull}
        disabled={pullLoading}
      >
        {pullLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Pull Latest
      </Button>

      <div className="relative mb-4 shrink-0">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search branches..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <ScrollArea className="h-full pr-4 pb-8">
        <div className="flex flex-col gap-2 pr-4">
          {filteredBranches.map((branch) => (
            <Button
              key={branch}
              variant={
                branch === project.currentBranch ? "default" : "secondary"
              }
              className="w-full justify-between"
              onClick={() => handleCheckout(branch)}
              disabled={!!checkoutLoading}
            >
              <span className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                {branch}
              </span>
              {branch === project.currentBranch && (
                <Check className="h-4 w-4" />
              )}
              {checkoutLoading === branch && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
