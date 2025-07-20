import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Code, Eye, Download } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Website Builder</h1>
            <nav className="flex items-center space-x-4">
              <Link href="/upload">
                <Button>Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold mb-6">
              AI-Powered Website Editor
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Upload your website and edit it with AI. Change colors, text, layout - all through natural language commands. 
              Live preview of changes as you type.
            </p>
            <Link href="/upload">
              <Button size="lg" className="text-lg px-8 py-4">
                <Upload className="mr-2 h-5 w-5" />
                Upload Your Website
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Upload className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>1. Upload</CardTitle>
                  <CardDescription>
                    Upload your website files (HTML, CSS, JS) or entire project folders
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Code className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>2. Edit with AI</CardTitle>
                  <CardDescription>
                    Use natural language to describe changes. "Make the header blue" or "Change the title to 'Welcome'"
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Eye className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>3. Live Preview</CardTitle>
                  <CardDescription>
                    See changes instantly in real-time. Preview your modifications side-by-side with the editor
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Website?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join the future of web development with AI-powered editing
            </p>
            <Link href="/upload">
              <Button size="lg" className="text-lg px-8 py-4">
                <Download className="mr-2 h-5 w-5" />
                Start Building Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 Website Builder. AI-powered website editing.</p>
        </div>
      </footer>
    </div>
  );
}