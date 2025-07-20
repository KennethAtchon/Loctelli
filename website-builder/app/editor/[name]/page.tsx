"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EditorInterface } from "@/components/ai-editor/editor-interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, Download, Eye } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Website, WebsiteFile } from "@/lib/api/website-builder";

export default function EditorPage() {
  const params = useParams();
  const websiteId = params.name as string;
  
  const [website, setWebsite] = useState<Website | null>(null);
  const [files, setFiles] = useState<WebsiteFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadWebsite = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load website from API
        const websiteData = await api.websiteBuilder.getWebsite(websiteId);
        setWebsite(websiteData);
        setFiles(websiteData.files);
      } catch (err) {
        console.error("Failed to load website:", err);
        setError("Failed to load website. Please check if the website exists and try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (websiteId) {
      loadWebsite();
    }
  }, [websiteId]);

  const handleSave = async (changes: Array<{ fileName: string; content: string }>) => {
    try {
      // Update the website with the changes
      await api.websiteBuilder.saveChanges(websiteId, changes);
      
      // Update local state
      const updatedFiles = files.map(file => {
        const change = changes.find(c => c.fileName === file.name);
        return change ? { ...file, content: change.content } : file;
      });
      setFiles(updatedFiles);
      
      // Update website object
      if (website) {
        setWebsite({ ...website, files: updatedFiles });
      }
      
      return { success: true };
    } catch (error) {
      console.error("Failed to save changes:", error);
      throw new Error("Failed to save changes. Please try again.");
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Use the download helper method
      await api.websiteBuilder.downloadWebsite(websiteId);
      
      // Show success message
      console.log("Website exported successfully!");
    } catch (error) {
      console.error("Failed to export website:", error);
      throw new Error("Failed to export website. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading website editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error Loading Website
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <div className="flex space-x-2">
              <Button asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!website || files.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Files Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              No files were found for this website. Please check the website ID and try again.
            </p>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <EditorInterface
      websiteName={website.name}
      files={files}
      onSave={handleSave}
      onExport={handleExport}
      previewUrl={`/preview/${websiteId}`}
    />
  );
} 