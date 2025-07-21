"use client";

import { useState } from "react";
import { WebsiteBuilderApi } from "@/lib/api/website-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

const api = new WebsiteBuilderApi();

export default function DashboardPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // TODO: Add polling for build status, job dashboard, notifications, etc.

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);
    setQueuePosition(null);
    setJobId(null);
    try {
      const websiteName = `website-${Date.now()}`;
      const response = await api.uploadWebsite(files, websiteName, "Uploaded via dashboard");
      setUploadResult(response);
      if (response && 'jobId' in response) {
        setJobId((response as any).jobId ?? null);
        setQueuePosition((response as any).queuePosition ?? null);
      }
    } catch (err: any) {
      setUploadError(err?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-10">
      <Card className="w-full max-w-xl mb-8">
        <CardHeader>
          <CardTitle>Upload Website</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Input type="file" multiple onChange={handleFileChange} disabled={isUploading} />
            <Button onClick={handleUpload} disabled={isUploading || files.length === 0}>
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
            {uploadError && <div className="text-red-500">{uploadError}</div>}
            {jobId && (
              <div className="text-green-600">
                Build job queued! Job ID: <span className="font-mono">{jobId}</span>
                {queuePosition && (
                  <span> (Queue position: {queuePosition})</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* TODO: Build Progress, Queue Dashboard, Notifications */}
      <div className="w-full max-w-4xl">
        {/* Build progress, job list, and notifications will go here */}
        <div className="text-muted-foreground text-center py-8">
          <span>Queue dashboard, build progress, and notifications coming soon...</span>
        </div>
      </div>
    </div>
  );
} 