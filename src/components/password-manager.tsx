"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Plus,
  Search,
  Copy,
  Trash2,
  Key,
  Loader2,
  ArrowLeft,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { API_BASE_URL } from "@/config";
import { ScrollArea } from "@/components/ui/scroll-area";

type PasswordEntry = {
  id: string;
  site: string;
  username: string;
  password: string;
  updatedAt: string;
};

export function PasswordManager() {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // View mode: 'list' or 'add'
  const [viewMode, setViewMode] = useState<"list" | "add">("list");

  // Form state
  const [formData, setFormData] = useState({
    site: "",
    username: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPasswords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/passwords`);
      if (res.ok) {
        const data = await res.json();
        setPasswords(data);
      }
    } catch {
      toast.error("Failed to load passwords");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPasswords();
    }
  }, [isOpen]);

  const handleCopy = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${description} copied!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/passwords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Password saved successfully");
        setFormData({ site: "", username: "", password: "" });
        setViewMode("list"); // Go back to list view
        fetchPasswords();
      } else {
        toast.error("Failed to save password");
      }
    } catch {
      toast.error("Error saving password");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, site: string) => {
    if (!confirm(`${site}のパスワードを削除しますか？`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/passwords?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Deleted successfully");
        setPasswords((prev) => prev.filter((p) => p.id !== id));
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Error deleting");
    }
  };

  const filteredPasswords = passwords.filter(
    (p) =>
      p.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Key className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[90vw] max-w-[90vw] min-w-[90vw] flex flex-col h-full bg-background">
        <SheetHeader className="pb-2 border-b shrink-0">
          <div className="flex items-center justify-between">
            {viewMode === "add" ? (
              <Button onClick={() => setViewMode("list")} variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
              </Button>
            ) : (
              <SheetTitle className="flex items-center gap-1">
                <Key className="h-4 w-4 pt-1" /> Password Manager
              </SheetTitle>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden relative">
          {viewMode === "list" ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 gap-2">
                <div className="relative w-full">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sites..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                {viewMode === "list" && (
                  <Button onClick={() => setViewMode("add")} size="sm">
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-full pb-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pr-4">
                    {filteredPasswords.map((entry) => (
                      <Card
                        key={entry.id}
                        className="group hover:border-primary/50 transition-colors"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">
                              {entry.site}
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2"
                              onClick={() => handleDelete(entry.id, entry.site)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {entry.username && (
                            <CardDescription>{entry.username}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="text-xs text-muted-foreground hidden">
                            Last updated:{" "}
                            {new Date(entry.updatedAt).toLocaleDateString()}
                          </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                          {entry.username && (
                            <Button
                              variant="secondary"
                              className="flex-1"
                              onClick={() =>
                                handleCopy(entry.username, "Username")
                              }
                            >
                              <User className="mr-2 h-4 w-4" /> Copy User
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() =>
                              handleCopy(entry.password, "Password")
                            }
                          >
                            <Copy className="mr-2 h-4 w-4" /> Copy Pass
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}

                    {filteredPasswords.length === 0 && (
                      <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        No passwords found. Add one to get started.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Add Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Add a new site password to your secure storage.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Site Name</label>
                    <Input
                      required
                      placeholder="e.g. Google"
                      value={formData.site}
                      onChange={(e) =>
                        setFormData({ ...formData, site: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Username (Optional)
                    </label>
                    <Input
                      placeholder="email@example.com"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      required
                      type="password"
                      placeholder="********"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                  </div>
                </div>
                <SheetFooter className="mt-8">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto"
                  >
                    {submitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Password
                  </Button>
                </SheetFooter>
              </form>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
