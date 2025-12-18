"use client";

import { useEffect, useState } from "react";
import { ProjectCard } from "@/components/project-card";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Project {
  name: string;
  path: string;
  status: "running" | "stopped" | "error";
  command?: string;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch (e) {
      console.error("Failed to load projects");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Project Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your local Next.js projects from one place.
          </p>
        </div>
        <Button variant="outline" onClick={fetchProjects} disabled={refreshing}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.path}
            project={project}
            onRefresh={fetchProjects}
          />
        ))}
        {projects.length === 0 && !refreshing && (
          <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            No supported projects found in the workspace.
          </div>
        )}
      </div>
    </div>
  );
}
