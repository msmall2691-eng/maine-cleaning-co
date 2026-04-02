import { getBlogPosts } from "@/lib/blog-data";
import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight } from "lucide-react";

export default function Blog() {
  useSEO({ title: "Journal & Insights", description: "Cleaning tips, home maintenance advice, and short-term rental insights from The Maine Cleaning Co. — Southern Maine's trusted cleaning experts." });
  const posts = getBlogPosts();

  return (
    <div className="bg-background min-h-screen pb-16 sm:pb-24">
      <div className="relative bg-secondary/50 pt-24 sm:pt-32 pb-12 sm:pb-20 border-b border-border overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/blog-hero-cleaning-tips.jpeg"
            alt="Clean home interior"
            className="w-full h-full object-cover opacity-[0.05]"
          />
        </div>
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold text-foreground mb-4 sm:mb-6" data-testid="text-blog-heading">Journal & Insights</h1>
          <p className="text-base sm:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Cleaning tips, company news, and insights for maintaining a beautiful home or business in Southern Maine.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 mt-8 sm:mt-16 max-w-6xl">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-card rounded-2xl sm:rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
              data-testid={`card-blog-${post.id}`}
            >
              <Link href={`/blog/${post.id}`} className="block overflow-hidden relative aspect-[4/3]">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-card/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-primary">
                  {post.category}
                </div>
              </Link>
              
              <div className="p-5 sm:p-8 flex flex-col flex-grow">
                <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground font-medium mb-3 sm:mb-4">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
                </div>
                
                <Link href={`/blog/${post.id}`}>
                  <h3 className="text-xl sm:text-2xl font-bold font-serif mb-2 sm:mb-3 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                </Link>
                
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 flex-grow line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>
                
                <Link href={`/blog/${post.id}`}>
                  <span className="inline-flex items-center text-sm sm:text-base font-semibold text-primary hover:text-primary/80 transition-colors" data-testid={`link-read-${post.id}`}>
                    Read Article <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}