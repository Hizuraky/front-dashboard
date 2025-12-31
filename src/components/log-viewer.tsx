"use client";

import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/config";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LogViewerProps {
  path: string;
}

export function LogViewer({ path }: LogViewerProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/logs?path=${encodeURIComponent(path)}`
        );
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs);
        }
      } catch (e) {
        console.error("Failed to fetch logs", e);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 1000);
    return () => clearInterval(interval);
  }, [path]);

  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;

    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      // 下から 100px 以内なら「一番下」とみなす（余裕を持たせる）
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      isAtBottomRef.current = isAtBottom;
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <ScrollArea
      ref={scrollAreaRef}
      className="h-full w-full rounded-xl bg-slate-950 p-4 text-xs font-mono text-slate-50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
    >
      {logs.length === 0 ? (
        <div className="text-slate-500 italic">No logs available...</div>
      ) : (
        logs.map((log, i) => (
          <div key={i} className="whitespace-pre-wrap break-all">
            {log}
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </ScrollArea>
  );
}
