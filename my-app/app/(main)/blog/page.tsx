import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog - Loctelli',
  description: 'Latest insights on AI-powered lead generation and sales automation',
};

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Blog
            </h1>
            <p className="text-xl text-muted-foreground">
              Insights on AI-powered lead generation and sales automation
            </p>
          </header>

          <section className="space-y-8">
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Blog posts coming soon...
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}