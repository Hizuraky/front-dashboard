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
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { API_BASE_URL } from "@/config";

type PasswordEntry = {
  id: string;
  site: string;
  username: string;
  password: string;
  updatedAt: string;
};

export default function PasswordsPage() {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
    fetchPasswords();
  }, []);

  const handleCopy = (password: string, site: string) => {
    navigator.clipboard.writeText(password);
    toast.success(`Password for ${site} copied!`);
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
        setIsSheetOpen(false);
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
    if (!confirm(`Are you sure you want to delete password for ${site}?`))
      return;

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
    <div className="w-full mx-auto px-6 py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6" /> Password Manager
          </h1>
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add New
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add Password</SheetTitle>
              <SheetDescription>
                Add a new site password to your secure storage.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
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
              <SheetFooter className="mt-8">
                <Button type="submit" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Password
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search sites..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPasswords.map((entry) => (
            <Card
              key={entry.id}
              className="group hover:border-primary/50 transition-colors"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{entry.site}</CardTitle>
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
                  Last updated: {new Date(entry.updatedAt).toLocaleDateString()}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => handleCopy(entry.password, entry.site)}
                >
                  <Copy className="mr-2 h-4 w-4" /> Copy Password
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
      )}
    </div>
  );
}
