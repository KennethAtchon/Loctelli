"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Code, Eye, Download, Sparkles, ExternalLink } from "lucide-react";
import { UploadZone } from "@/components/upload-zone";
import { BuildProgress } from "@/components/build-progress";
import { api } from "@/lib/api";
import logger from "@/lib/logger";

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedWebsite, setUploadedWebsite] = useState<{
    id: string;
    name: string;
    type: string;
    buildStatus?: string;
    previewUrl?: string;
  } | null>(null);
  const [showBuildProgress, setShowBuildProgress] = useState(false);

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
        
        // Check if this is a React/Vite project that needs building
        const isReactViteProject = response.website.type === 'react-vite' || 
                                  response.website.type === 'react' || 
                                  response.website.type === 'vite';
        
        if (isReactViteProject) {
          logger.log(`🔨 React/Vite project detected. Starting build process...`);
          setUploadedWebsite(response.website);
          setShowBuildProgress(true);
        } else {
          logger.log(`🔄 Redirecting to editor: /editor/${response.website.id}`);
          // Navigate to editor with the created website
          window.location.href = `/editor/${response.website.id}`;
        }
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
            React/Vite Project Hosting & AI Editing
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upload your React/Vite projects and get instant live preview with automatic builds. 
            Edit with AI and deploy with confidence.
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

        {/* Build Progress Section */}
        {showBuildProgress && uploadedWebsite && (
          <div className="max-w-2xl mx-auto mb-12">
            <BuildProgress
              websiteId={uploadedWebsite.id}
              onBuildComplete={(previewUrl) => {
                logger.log(`✅ Build completed! Preview URL: ${previewUrl}`);
                setUploadedWebsite(prev => prev ? { ...prev, previewUrl } : null);
              }}
              onBuildError={(error) => {
                logger.error(`❌ Build failed: ${error}`);
                // Keep the build progress visible so user can see the error and restart
              }}
            />
            
            {/* Success Actions */}
            {uploadedWebsite.previewUrl && (
              <Card className="mt-4">
                <CardContent className="p-6">
                  <div className="flex space-x-4">
                    <Button
                      onClick={() => window.open(uploadedWebsite.previewUrl, '_blank')}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Live Preview
                    </Button>
                    <Button
                      onClick={() => window.location.href = `/editor/${uploadedWebsite.id}`}
                      variant="outline"
                      className="flex-1"
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Open Editor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Code className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>React/Vite Support</CardTitle>
              <CardDescription>
                Upload React/Vite projects and get automatic npm install, type checking, and live preview
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Eye className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                See your React app running in real-time with hot reload. Interact with your application
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Download className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>AI-Powered Editing</CardTitle>
              <CardDescription>
                Use natural language to describe changes. "Make the header blue" or "Change the title"
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
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Upload Project</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your React/Vite project files or ZIP archive
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Auto Build</h3>
                <p className="text-sm text-muted-foreground">
                  Automatic npm install, type checking, and server startup
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Live Preview</h3>
                <p className="text-sm text-muted-foreground">
                  Interact with your running React application
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">4</span>
                </div>
                <h3 className="font-semibold mb-2">Edit & Deploy</h3>
                <p className="text-sm text-muted-foreground">
                  Use AI to edit or download your modified files
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