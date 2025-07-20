"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Code, Eye, Download, Sparkles } from "lucide-react";
import { UploadZone } from "@/components/upload-zone";
import { api } from "@/lib/api";
import logger from "@/lib/logger";

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFilesSelected = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleUpload = async () => {
    logger.log("🚀 Starting upload process...");
    setIsUploading(true);
    
    try {
      if (uploadedFiles.length === 0) {
        logger.error("❌ No files selected for upload");
        alert("Please select files to upload");
        return;
      }

      logger.log(`📁 Files to upload: ${uploadedFiles.length} files`);
      uploadedFiles.forEach((file, index) => {
        logger.log(`📄 File ${index + 1}: ${file.name} (${file.size} bytes, ${file.type})`);
      });

      // Create a unique website name
      const websiteName = `website-${Date.now()}`;
      logger.log(`📝 Generated website name: ${websiteName}`);
      
      // Upload files to backend
      logger.log("🌐 Calling website builder API...");
      const response = await api.websiteBuilder.uploadWebsite(uploadedFiles, websiteName, "Uploaded website");
      logger.log("📡 API response received:", response);
      
      if (response.success) {
        logger.log(`✅ Upload successful! Website ID: ${response.website.id}`);
        logger.log(`🔄 Redirecting to editor: /editor/${response.website.id}`);
        
        // Navigate to editor with the created website
        window.location.href = `/editor/${response.website.id}`;
      } else {
        logger.error("❌ Upload failed - API returned error:", response.error);
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      logger.error("❌ Upload process failed:", error);
      logger.error("❌ Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      alert("Upload failed. Please try again.");
    } finally {
      logger.log("🏁 Upload process completed");
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold">AI Website Builder</h1>
            </div>
            <div className="text-sm text-muted-foreground">
              Admin Access Only
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">
            Upload & Edit Websites with AI
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upload your website files and edit them using natural language. 
            Perfect for quick modifications and prototyping.
          </p>
        </div>

        {/* Upload Section */}
        <Card className="max-w-2xl mx-auto mb-12">
          <CardHeader className="text-center">
            <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Upload Your Website</CardTitle>
            <CardDescription>
              Drag and drop your website files or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadZone
              onFilesSelected={handleFilesSelected}
              onUpload={handleUpload}
              isUploading={isUploading}
            />
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Code className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>AI-Powered Editing</CardTitle>
              <CardDescription>
                Use natural language to describe changes. "Make the header blue" or "Change the title"
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Eye className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                See changes instantly in real-time. Preview modifications as you make them
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Download className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Export & Deploy</CardTitle>
              <CardDescription>
                Download your modified files or deploy directly to your hosting platform
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Start */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Quick Start Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Upload Files</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your website files using the form above
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Edit with AI</h3>
                <p className="text-sm text-muted-foreground">
                  Describe your changes in natural language
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Download</h3>
                <p className="text-sm text-muted-foreground">
                  Export your modified website files
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>AI Website Builder - Powered by Loctelli</p>
        </div>
      </footer>
    </div>
  );
}