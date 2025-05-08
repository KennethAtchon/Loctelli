import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import BlogPagination from "@/components/blog-pagination";
import { blogPosts } from "@/mock/blogPosts";

// All unique categories from blog posts
const categories = Array.from(new Set(blogPosts.map((post) => post.category)));

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative py-20 bg-gray-900">
          {/* Background elements */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500 rounded-full filter blur-[128px] opacity-10"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-purple-500 rounded-full filter blur-[128px] opacity-10"></div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Loctelli{" "}
                <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                  Blog
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Insights, strategies, and trends in AI-powered lead generation
                and sales automation
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <Input
                  type="text"
                  placeholder="Search articles..."
                  className="bg-gray-800 border-gray-700 pl-10 focus:border-blue-500 h-12 rounded-lg"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-8 bg-gray-950 border-b border-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge
                variant="outline"
                className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700 rounded-full px-4 py-2 text-sm cursor-pointer"
              >
                All
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant="outline"
                  className="bg-gray-900 hover:bg-gray-800 text-white border-gray-800 rounded-full px-4 py-2 text-sm cursor-pointer"
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16 bg-gray-950">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.id}`} className="group">
                  <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 h-full flex flex-col hover:border-gray-700 transition-colors duration-300">
                    <div className="h-48 overflow-hidden">
                      <img
                        src={post.image || "/placeholder.svg"}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center mb-3">
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
                          {post.category}
                        </Badge>
                        <span className="text-gray-400 text-sm ml-3">
                          {post.date}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold mb-3 group-hover:text-blue-400 transition-colors duration-300">
                        {post.title}
                      </h2>
                      <p className="text-gray-400 mb-4 flex-grow">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center">
                          <img
                            src={post.authorImage || "/placeholder.svg"}
                            alt={post.author}
                            className="w-8 h-8 rounded-full mr-2 object-cover"
                          />
                          <span className="text-sm text-gray-300">
                            {post.author}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400">
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-16">
              <BlogPagination currentPage={1} totalPages={5} />
            </div>

            {/* Newsletter Signup */}
            <div className="mt-20 bg-gray-900 rounded-xl p-8 border border-gray-800">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl font-bold mb-4">
                  Stay Updated with Our{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                    Newsletter
                  </span>
                </h2>
                <p className="text-gray-400 mb-6">
                  Get the latest insights on AI, lead generation, and sales
                  automation delivered to your inbox.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                  <Input
                    type="email"
                    placeholder="Your email address"
                    className="bg-gray-800 border-gray-700 focus:border-blue-500"
                  />
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
