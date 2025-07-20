"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EditorInterface } from "@/components/ai-editor/editor-interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

interface WebsiteFile {
  name: string;
  content: string;
  type: string;
}

export default function EditorPage() {
  const params = useParams();
  const websiteName = params.name as string;
  
  const [files, setFiles] = useState<WebsiteFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWebsite = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // TODO: Implement API call to load website files
        console.log("Loading website:", websiteName);
        
        // Simulate loading website files
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for now
        const mockFiles: WebsiteFile[] = [
          {
            name: "index.html",
            content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample Website</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>Welcome to My Website</h1>
        <nav>
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
        </nav>
    </header>
    
    <main>
        <section id="home">
            <h2>Home</h2>
            <p>This is a sample website for AI editing.</p>
            <button class="cta-button">Get Started</button>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2024 Sample Website</p>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>`,
            type: "html"
          },
          {
            name: "styles.css",
            content: `body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    line-height: 1.6;
}

header {
    background-color: #333;
    color: white;
    padding: 1rem;
    text-align: center;
}

nav {
    margin-top: 1rem;
}

nav a {
    color: white;
    text-decoration: none;
    margin: 0 1rem;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background-color 0.3s;
}

nav a:hover {
    background-color: #555;
}

main {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
}

.cta-button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
}

.cta-button:hover {
    background-color: #0056b3;
}

footer {
    background-color: #333;
    color: white;
    text-align: center;
    padding: 1rem;
    position: fixed;
    bottom: 0;
    width: 100%;
}`,
            type: "css"
          },
          {
            name: "script.js",
            content: `// Sample JavaScript file
console.log('Website loaded successfully!');

// Add some interactive functionality
document.addEventListener('DOMContentLoaded', function() {
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            alert('Button clicked! This is where you would add your functionality.');
        });
    }
});`,
            type: "js"
          }
        ];
        
        setFiles(mockFiles);
      } catch (err) {
        console.error("Failed to load website:", err);
        setError("Failed to load website. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (websiteName) {
      loadWebsite();
    }
  }, [websiteName]);

  const handleSave = async (changes: any) => {
    try {
      // TODO: Implement save functionality
      console.log("Saving changes:", changes);
      alert("Changes saved successfully!");
    } catch (error) {
      console.error("Failed to save changes:", error);
      alert("Failed to save changes. Please try again.");
    }
  };

  const handleExport = async () => {
    try {
      // TODO: Implement export functionality
      console.log("Exporting website:", websiteName);
      alert("Website exported successfully!");
    } catch (error) {
      console.error("Failed to export website:", error);
      alert("Failed to export website. Please try again.");
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

  if (files.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Files Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              No files were found for this website. Please check the website name and try again.
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
      websiteName={websiteName}
      files={files}
      onSave={handleSave}
      onExport={handleExport}
    />
  );
} 