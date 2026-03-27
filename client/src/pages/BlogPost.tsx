import { useParams, Link } from "wouter";
import { getBlogPostById } from "@/lib/blog-data";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Facebook, Twitter, Linkedin } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const post = getBlogPostById(params.slug || "");

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = post?.title || "";

  const handleShare = (platform: "facebook" | "twitter" | "linkedin") => {
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    };
    window.open(urls[platform], "_blank", "noopener,noreferrer,width=600,height=400");
  };

  if (!post) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-32 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-4">Post Not Found</h1>
        <p className="text-muted-foreground mb-8">We couldn't find the article you're looking for.</p>
        <Link href="/blog">
          <Button className="rounded-full">Back to Blog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-16 sm:pb-24">
      <div className="pt-24 sm:pt-32 pb-8 sm:pb-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <Link href="/blog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6 sm:mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Journal
          </Link>
          
          <div className="mb-4 sm:mb-6 flex items-center gap-2">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold" data-testid="badge-category">
              {post.category}
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-4 sm:mb-6 leading-tight" data-testid="text-blog-title">
            {post.title}
          </h1>
          
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground font-medium pb-6 sm:pb-8 border-b border-black/5">
            <span className="flex items-center gap-1.5 sm:gap-2"><Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {post.date}</span>
            <span className="flex items-center gap-1.5 sm:gap-2"><Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {post.readTime}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-4xl mb-8 sm:mb-12">
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[21/9] bg-secondary/50 border border-black/5 shadow-sm">
          <img 
            src={post.image} 
            alt={post.title} 
            className="w-full h-full object-cover"
            data-testid="img-blog-hero"
          />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        <article className="prose prose-base sm:prose-lg md:prose-xl prose-stone max-w-none text-foreground prose-headings:font-serif prose-headings:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>
        
        <div className="mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-black/5 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="font-semibold text-foreground text-sm sm:text-base">Share this article</div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-black/10 text-muted-foreground hover:text-primary"
              onClick={() => handleShare("facebook")}
              aria-label="Share on Facebook"
              data-testid="button-share-facebook"
            >
              <Facebook className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-black/10 text-muted-foreground hover:text-primary"
              onClick={() => handleShare("twitter")}
              aria-label="Share on Twitter"
              data-testid="button-share-twitter"
            >
              <Twitter className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-black/10 text-muted-foreground hover:text-primary"
              onClick={() => handleShare("linkedin")}
              aria-label="Share on LinkedIn"
              data-testid="button-share-linkedin"
            >
              <Linkedin className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="mt-10 sm:mt-16 bg-secondary/30 p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl border border-black/5 text-center">
          <h3 className="text-xl sm:text-2xl font-serif font-bold mb-3 sm:mb-4 text-foreground">Need professional cleaning?</h3>
          <p className="text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
            Let the experts at The Maine Cleaning Co. handle the dirty work so you can enjoy your free time.
          </p>
          <Link href="/">
            <Button size="lg" className="rounded-full px-8 shadow-sm" data-testid="button-get-quote">Get an Instant Quote</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}