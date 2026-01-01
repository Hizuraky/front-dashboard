"use client";

import { useEffect, useState } from "react";
import { ProjectCard } from "@/components/project-card";
import { RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/config";

import type { Project } from "@/types/project";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchProjects = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch {
      console.error("Failed to load projects");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="w-full mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 justify-between w-full">
          <div className="relative w-full">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full max-w-[500px]"
            />
          </div>
          <Button
            variant="outline"
            onClick={fetchProjects}
            disabled={refreshing}
            className="max-[500px]:w-9 max-[500px]:px-0"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 max-[500px]:mr-0 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            <span className="max-[500px]:hidden">Refresh</span>
          </Button>
          <ModeToggle />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {filteredProjects.map((project) => (
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
