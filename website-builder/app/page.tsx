"use client"

import { useState } from "react"
import { ChatPanel } from "@/components/chat-panel"
import { CodeEditor } from "@/components/code-editor"
import { PreviewPanel } from "@/components/preview-panel"
import { EnhancedHeader } from "@/components/enhanced-header"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { UploadZone } from "@/components/upload-zone"
import { BuildProgress } from "@/components/build-progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Code, Eye, Download, Sparkles, ExternalLink } from "lucide-react"
import { api } from "@/lib/api"
import logger from "@/lib/logger"
import type { WebsiteFile } from "@/components/file-browser"

export default function Home() {
  // State for the new v0-style interface
  const [code, setCode] = useState(`export default function Component() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to AI Website Builder
        </h1>
        <p className="text-lg text-gray-600">
          Upload your website and start editing with AI
        </p>
      </div>
    </div>
  )
}`)

  const [chatVisible, setChatVisible] = useState(true)
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview")

  // State for website upload functionality (preserved from original)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadedWebsite, setUploadedWebsite] = useState<{
    id: string
    name: string
    type: string
    buildStatus?: string
    previewUrl?: string
  } | null>(null)
  const [showBuildProgress, setShowBuildProgress] = useState(false)
  
  // State for website files and editing
  const [websiteFiles, setWebsiteFiles] = useState<WebsiteFile[]>([])
  const [selectedFile, setSelectedFile] = useState<WebsiteFile | null>(null)

  const handleFilesSelected = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files])
  }

  const handleUpload = async () => {
    logger.log("🚀 Starting upload process...")
    setIsUploading(true)
    
    try {
      if (uploadedFiles.length === 0) {
        logger.error("❌ No files selected for upload")
        alert("Please select files to upload")
        return
      }

      logger.log(`📁 Files to upload: ${uploadedFiles.length} files`)
      uploadedFiles.forEach((file, index) => {
        logger.log(`📄 File ${index + 1}: ${file.name} (${file.size} bytes, ${file.type})`)
      })

      // Create a unique website name
      const websiteName = `website-${Date.now()}`
      logger.log(`📝 Generated website name: ${websiteName}`)
      
      // Upload files to backend
      logger.log("🌐 Calling website builder API...")
      const response = await api.websiteBuilder.uploadWebsite(uploadedFiles, websiteName, "Uploaded website")
      logger.log("📡 API response received:", response)
      
      if (response.success) {
        logger.log(`✅ Upload successful! Website ID: ${response.website.id}`)
        
        // Check if this is a React/Vite project that needs building
        const isReactViteProject = response.website.type === 'react-vite' || 
                                  response.website.type === 'react' || 
                                  response.website.type === 'vite'
        
        if (isReactViteProject) {
          logger.log(`🔨 React/Vite project detected. Starting build process...`)
          setUploadedWebsite(response.website)
          setShowBuildProgress(true)
        } else {
          logger.log(`🔄 Redirecting to preview: /preview/${response.website.id}`)
          // Navigate to preview for static files
          window.location.href = `/preview/${response.website.id}`
        }
      } else {
        logger.error("❌ Upload failed - API returned error:", response.error)
        throw new Error(response.error || 'Upload failed')
      }
    } catch (error) {
      logger.error("❌ Upload process failed:", error)
      logger.error("❌ Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      alert("Upload failed. Please try again.")
    } finally {
      logger.log("🏁 Upload process completed")
      setIsUploading(false)
    }
  }

  // Show the v0-style interface by default
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Enhanced Header */}
      <EnhancedHeader
        chatVisible={chatVisible}
        setChatVisible={setChatVisible}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onUploadClick={() => setActiveTab("preview")}
        hasUploadedWebsite={!!uploadedWebsite}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {chatVisible && (
            <>
              <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                <ChatPanel 
                  onCodeUpdate={setCode} 
                  websiteId={uploadedWebsite?.id}
                  currentFile="App.tsx"
                />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

                      <ResizablePanel defaultSize={chatVisible ? 70 : 100}>
              {activeTab === "preview" ? (
                <PreviewPanel 
                  code={code} 
                  previewUrl={uploadedWebsite?.previewUrl}
                  websiteId={uploadedWebsite?.id}
                  onFilesSelected={handleFilesSelected}
                  onUpload={handleUpload}
                  isUploading={isUploading}
                  showBuildProgress={showBuildProgress}
                  uploadedWebsite={uploadedWebsite}
                  websiteFiles={websiteFiles}
                  selectedFile={selectedFile}
                  onBuildComplete={async (previewUrl) => {
                    logger.log(`✅ Build completed! Preview URL: ${previewUrl}`)
                    setUploadedWebsite(prev => prev ? { ...prev, previewUrl } : null)
                    
                    // Load website files for editing
                    if (uploadedWebsite?.id) {
                      try {
                        const websiteData = await api.websiteBuilder.getWebsite(uploadedWebsite.id)
                        setWebsiteFiles(websiteData.files || [])
                        if (websiteData.files && websiteData.files.length > 0) {
                          setSelectedFile(websiteData.files[0])
                          // Don't set the code state for uploaded files - it's only for demo code
                          // The code editor will get the content from selectedFile
                        }
                      } catch (error) {
                        logger.error("Failed to load website files:", error)
                      }
                    }
                  }}
                  onBuildError={(error) => {
                    logger.error(`❌ Build failed: ${error}`)
                  }}
                  onEditCode={() => setActiveTab("code")}
                />
              ) : (
                <CodeEditor 
                  code={code} 
                  onChange={setCode}
                  filePath="App.tsx"
                  websiteId={uploadedWebsite?.id}
                  files={websiteFiles}
                  selectedFile={selectedFile}
                  onFileSelect={(file) => {
                    setSelectedFile(file)
                    // Update the file in the websiteFiles array
                    setWebsiteFiles(prev => 
                      prev.map(f => f.name === file.name ? file : f)
                    )
                  }}
                />
              )}
            </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )


}