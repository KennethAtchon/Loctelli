import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, Share2, Facebook, Twitter, Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

// Sample blog data - in a real app, this would come from a database or CMS
const blogPosts = [
  {
    id: "how-ai-revolutionizing-lead-generation",
    title: "How AI is Revolutionizing Lead Generation",
    excerpt:
      "Discover how artificial intelligence is transforming the way businesses generate and qualify leads, leading to higher conversion rates and more efficient sales processes.",
    content: `
      <p class="text-lg mb-4">Artificial Intelligence (AI) has become a game-changer in the world of lead generation, transforming how businesses identify, engage with, and convert potential customers. This technological revolution is not just enhancing existing processes but completely reimagining the lead generation landscape.</p>
      
      <h2 class="text-2xl font-bold mt-8 mb-4">The Traditional Lead Generation Challenge</h2>
      
      <p class="mb-4">For decades, businesses have struggled with the inefficiencies of traditional lead generation methods:</p>
      
      <ul class="list-disc pl-6 mb-6 space-y-2">
        <li>Manual qualification processes that are time-consuming and error-prone</li>
        <li>Sales teams spending valuable time on unqualified leads</li>
        <li>Inability to scale outreach efforts without proportionally increasing staff</li>
        <li>Inconsistent lead scoring and prioritization</li>
        <li>Limited hours of operation for lead engagement</li>
      </ul>
      
      <p class="mb-4">These challenges have created significant bottlenecks in the sales pipeline, resulting in missed opportunities and wasted resources.</p>
      
      <h2 class="text-2xl font-bold mt-8 mb-4">Enter AI-Powered Lead Generation</h2>
      
      <p class="mb-4">AI technologies are addressing these pain points through several innovative approaches:</p>
      
      <h3 class="text-xl font-semibold mt-6 mb-3">1. Intelligent Lead Scoring and Qualification</h3>
      
      <p class="mb-4">AI algorithms can analyze vast amounts of data points to score leads based on their likelihood to convert. These systems consider factors such as:</p>
      
      <ul class="list-disc pl-6 mb-6 space-y-2">
        <li>Demographic information</li>
        <li>Online behavior patterns</li>
        <li>Engagement history</li>
        <li>Purchase intent signals</li>
        <li>Social media activity</li>
      </ul>
      
      <p class="mb-4">By automatically qualifying leads, AI ensures that sales teams focus their efforts on prospects with the highest conversion potential.</p>
      
      <h3 class="text-xl font-semibold mt-6 mb-3">2. 24/7 Conversational Engagement</h3>
      
      <p class="mb-4">AI-powered chatbots and virtual assistants have revolutionized how businesses engage with potential leads:</p>
      
      <ul class="list-disc pl-6 mb-6 space-y-2">
        <li>Providing instant responses to inquiries at any time of day</li>
        <li>Qualifying leads through natural conversation</li>
        <li>Answering common questions and addressing objections</li>
        <li>Scheduling meetings with human sales representatives</li>
        <li>Collecting valuable information for further personalization</li>
      </ul>
      
      <p class="mb-4">These AI assistants never sleep, ensuring that no lead goes unattended regardless of when they reach out.</p>
      
      <h3 class="text-xl font-semibold mt-6 mb-3">3. Predictive Analytics for Targeted Outreach</h3>
      
      <p class="mb-4">AI systems can predict which prospects are most likely to need your solution based on:</p>
      
      <ul class="list-disc pl-6 mb-6 space-y-2">
        <li>Industry trends and market conditions</li>
        <li>Company growth indicators</li>
        <li>Technological adoption patterns</li>
        <li>Hiring activities and job postings</li>
        <li>Recent funding or investment news</li>
      </ul>
      
      <p class="mb-4">This predictive capability allows for highly targeted outreach campaigns that reach prospects at the perfect moment in their buyer's journey.</p>
      
      <h2 class="text-2xl font-bold mt-8 mb-4">Real-World Results</h2>
      
      <p class="mb-4">Companies implementing AI-powered lead generation are seeing remarkable improvements:</p>
      
      <ul class="list-disc pl-6 mb-6 space-y-2">
        <li>50-300% increase in qualified leads</li>
        <li>40% reduction in cost per lead</li>
        <li>60% faster lead qualification process</li>
        <li>35% higher conversion rates</li>
        <li>25% increase in average deal size</li>
      </ul>
      
      <p class="mb-4">These statistics demonstrate that AI is not just an incremental improvement but a transformative force in lead generation.</p>
      
      <h2 class="text-2xl font-bold mt-8 mb-4">The Future of AI in Lead Generation</h2>
      
      <p class="mb-4">As AI technology continues to evolve, we can expect even more sophisticated lead generation capabilities:</p>
      
      <ul class="list-disc pl-6 mb-6 space-y-2">
        <li>Hyper-personalized outreach based on deep behavioral analysis</li>
        <li>Emotion detection in conversations to better address prospect concerns</li>
        <li>Predictive lead journey mapping to anticipate next steps</li>
        <li>Cross-channel lead nurturing with consistent messaging</li>
        <li>Autonomous optimization of lead generation strategies</li>
      </ul>
      
      <p class="mb-4">The businesses that embrace these AI-powered approaches will gain a significant competitive advantage in their markets.</p>
      
      <h2 class="text-2xl font-bold mt-8 mb-4">Conclusion</h2>
      
      <p class="mb-4">AI is revolutionizing lead generation by making it more efficient, effective, and scalable. By automating qualification, enabling 24/7 engagement, and leveraging predictive analytics, AI technologies are helping businesses connect with the right prospects at the right time with the right message.</p>
      
      <p class="mb-4">For companies looking to stay competitive in today's fast-paced business environment, adopting AI-powered lead generation isn't just an option—it's becoming a necessity.</p>
    `,
    date: "April 15, 2025",
    image: "/placeholder.svg?height=600&width=1200",
    category: "AI Technology",
    author: "Sarah Johnson",
    authorTitle: "VP of Product, Loctelli",
    authorImage: "/placeholder.svg?height=100&width=100",
    authorBio:
      "Sarah Johnson is the VP of Product at Loctelli with over 15 years of experience in AI and machine learning applications for business. She specializes in developing AI solutions that drive measurable business outcomes.",
    readTime: "5 min read",
    tags: ["AI", "Lead Generation", "Sales Automation", "Machine Learning", "Business Growth"],
  },
  {
    id: "5-ways-optimize-sales-funnel-automation",
    title: "5 Ways to Optimize Your Sales Funnel with Automation",
    excerpt:
      "Learn practical strategies to streamline your sales process and increase conversion rates using the latest automation technologies and AI-driven insights.",
    content: `<p>This is a sample content for the second blog post.</p>`,
    date: "April 8, 2025",
    image: "/placeholder.svg?height=600&width=1200",
    category: "Sales Strategy",
    author: "Michael Chen",
    authorTitle: "Sales Director, Loctelli",
    authorImage: "/placeholder.svg?height=100&width=100",
    authorBio:
      "Michael Chen is the Sales Director at Loctelli with expertise in sales process optimization and automation implementation.",
    readTime: "7 min read",
    tags: ["Sales Funnel", "Automation", "Conversion Optimization", "CRM", "Sales Process"],
  },
]

// Sample related posts
const relatedPosts = [
  {
    id: "future-b2b-sales-ai-powered-conversations",
    title: "The Future of B2B Sales: AI-Powered Conversations",
    excerpt:
      "Explore how conversational AI is changing the landscape of business-to-business sales, enabling 24/7 lead qualification and personalized customer interactions.",
    date: "March 30, 2025",
    image: "/placeholder.svg?height=200&width=400",
    category: "Industry Trends",
    author: "Jessica Rivera",
    readTime: "6 min read",
  },
  {
    id: "measuring-roi-ai-lead-generation",
    title: "Measuring ROI on AI Lead Generation Investments",
    excerpt:
      "A comprehensive guide to calculating and maximizing the return on investment for your AI-powered lead generation tools and strategies.",
    date: "March 22, 2025",
    image: "/placeholder.svg?height=200&width=400",
    category: "Analytics",
    author: "Alex Thompson",
    readTime: "8 min read",
  },
  {
    id: "ethical-considerations-ai-sales",
    title: "Ethical Considerations in AI-Driven Sales",
    excerpt:
      "An exploration of the ethical implications of using AI in sales processes, including privacy concerns, transparency, and maintaining the human touch.",
    date: "March 15, 2025",
    image: "/placeholder.svg?height=200&width=400",
    category: "Ethics",
    author: "David Wilson",
    readTime: "9 min read",
  },
]

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  // Find the blog post with the matching slug
  const post = blogPosts.find((post) => post.id === params.slug)

  // If no post is found, you might want to handle this case
  if (!post) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Blog Post Not Found</h1>
          <p className="mb-6">The blog post you're looking for doesn't exist or has been moved.</p>
          <Button asChild>
            <Link href="/blog">Back to Blog</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-10 bg-gray-900">
          {/* Background elements */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500 rounded-full filter blur-[128px] opacity-10"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-purple-500 rounded-full filter blur-[128px] opacity-10"></div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <Link
              href="/blog"
              className="inline-flex items-center text-gray-400 hover:text-blue-400 transition-colors mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>

            <div className="max-w-4xl mx-auto">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 mb-4">
                {post.category}
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">{post.title}</h1>

              <div className="flex flex-wrap items-center gap-4 mb-8 text-gray-400">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{post.date}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{post.readTime}</span>
                </div>
              </div>

              <div className="flex items-center mb-8">
                <Avatar className="h-12 w-12 mr-4 border-2 border-blue-500">
                  <AvatarImage src={post.authorImage || "/placeholder.svg"} alt={post.author} />
                  <AvatarFallback>
                    {post.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold">{post.author}</h4>
                  <p className="text-gray-400 text-sm">{post.authorTitle}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Image */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-xl overflow-hidden">
              <img src={post.image || "/placeholder.svg"} alt={post.title} className="w-full h-auto" />
            </div>
          </div>
        </div>

        {/* Blog Content */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {/* Social Share Sidebar */}
              <div className="hidden lg:block fixed left-8 top-1/2 transform -translate-y-1/2">
                <div className="flex flex-col items-center space-y-4">
                  <div className="text-gray-400 mb-2">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <button className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-900 transition-colors">
                    <Facebook className="h-5 w-5 text-gray-300" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-500 transition-colors">
                    <Twitter className="h-5 w-5 text-gray-300" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-700 transition-colors">
                    <Linkedin className="h-5 w-5 text-gray-300" />
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <article className="prose prose-lg prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              </article>

              {/* Tags */}
              <div className="mt-12 pt-6 border-t border-gray-800">
                <div className="flex flex-wrap gap-2">
                  {post.tags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Author Bio */}
              <div className="mt-12 bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <Avatar className="h-20 w-20 border-2 border-blue-500">
                    <AvatarImage src={post.authorImage || "/placeholder.svg"} alt={post.author} />
                    <AvatarFallback>
                      {post.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{post.author}</h3>
                    <p className="text-gray-400 mb-4">{post.authorTitle}</p>
                    <p className="text-gray-300">{post.authorBio}</p>
                  </div>
                </div>
              </div>

              {/* Mobile Share Buttons */}
              <div className="mt-8 flex justify-center space-x-4 lg:hidden">
                <button className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-900 transition-colors">
                  <Facebook className="h-5 w-5 text-gray-300" />
                </button>
                <button className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-500 transition-colors">
                  <Twitter className="h-5 w-5 text-gray-300" />
                </button>
                <button className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <Linkedin className="h-5 w-5 text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Related Posts */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-8">
              Related{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Articles
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} href={`/blog/${relatedPost.id}`} className="group">
                  <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 h-full flex flex-col hover:border-gray-600 transition-colors duration-300">
                    <div className="h-40 overflow-hidden">
                      <img
                        src={relatedPost.image || "/placeholder.svg"}
                        alt={relatedPost.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center mb-3">
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
                          {relatedPost.category}
                        </Badge>
                        <span className="text-gray-400 text-sm ml-3">{relatedPost.date}</span>
                      </div>
                      <h3 className="text-lg font-bold mb-3 group-hover:text-blue-400 transition-colors duration-300">
                        {relatedPost.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 flex-grow">{relatedPost.excerpt}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-sm text-gray-300">{relatedPost.author}</span>
                        <span className="text-sm text-gray-400">{relatedPost.readTime}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="py-16 bg-gray-950">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-gray-900 rounded-xl p-8 border border-gray-800">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">
                  Subscribe to Our{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                    Newsletter
                  </span>
                </h2>
                <p className="text-gray-400 mb-6">
                  Get the latest insights on AI, lead generation, and sales automation delivered to your inbox.
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
  )
}
