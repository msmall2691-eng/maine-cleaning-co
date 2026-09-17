import { useParams, Link } from "wouter";
import { getBlogPostById } from "@/lib/blog-data";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Facebook, Twitter, Linkedin } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Section } from "@/components/layout/Section";

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const post = getBlogPostById(params.slug || "");
  useSEO({ title: post?.title || "Blog Post", description: post?.excerpt || "Read cleaning tips and insights from The Maine Cleaning Co." });

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
      <Section
        measure="prose"
        rhythm="none"
        reveal={false}
        className="pt-28 sm:pt-36 lg:pt-40 pb-[clamp(3.25rem,6vw,5.5rem)]"
      >
        <div className="text-center">
          <h1 className="text-[2.25rem] sm:text-5xl leading-[1.05] font-serif font-bold tracking-[-0.02em] text-foreground section-heading-accent">
            Post Not Found
          </h1>
          <p className="mt-8 mb-8 text-[15px] sm:text-base text-muted-foreground leading-relaxed">
            We couldn't find the article you're looking for.
          </p>
          <Link href="/blog">
            <Button className="rounded-full">Back to Blog</Button>
          </Link>
        </div>
      </Section>
    );
  }

  return (
    <>
      {/* Title block sits on the article's own measure (`prose`)… */}
      <Section
        measure="prose"
        rhythm="none"
        reveal={false}
        className="pt-28 sm:pt-36 lg:pt-40 pb-[clamp(1.75rem,3vw,2.75rem)]"
      >
        <Link href="/blog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-7">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Journal
        </Link>

        <div className="mb-5 flex items-center gap-2">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold" data-testid="badge-category">
            {post.category}
          </span>
        </div>

        <h1 className="text-[2.25rem] sm:text-5xl leading-[1.05] font-serif font-bold tracking-[-0.02em] text-foreground" data-testid="text-blog-title">
          {post.title}
        </h1>

        <div className="mt-7 flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5 sm:gap-2"><Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {post.date}</span>
          <span className="flex items-center gap-1.5 sm:gap-2"><Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {post.readTime}</span>
        </div>
      </Section>

      {/* …and the lead image deliberately runs wider than it, which is the one
          thing this page already did better than the rest of the site. Kept —
          now expressed as two of the standard measures rather than two
          hand-rolled max-w values. */}
      <Section
        measure="default"
        rhythm="none"
        reveal={false}
        className="pb-[clamp(2rem,3.5vw,3rem)]"
      >
        <figure className="photo-frame aspect-[16/9] sm:aspect-[21/9]">
          <img
            src={post.image}
            alt={post.title}
            data-testid="img-blog-hero"
            decoding="async"
          />
        </figure>
      </Section>

      <Section measure="prose" rhythm="none" className="pb-[clamp(3.25rem,6vw,5.5rem)]">
        <article className="prose prose-base sm:prose-lg md:prose-xl prose-stone max-w-none text-foreground prose-headings:font-serif prose-headings:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>

        <div className="mt-12 sm:mt-16 pt-7 sm:pt-8 border-t border-border/60 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="font-semibold text-foreground text-sm sm:text-base">Share this article</div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-primary"
              onClick={() => handleShare("facebook")}
              aria-label="Share on Facebook"
              data-testid="button-share-facebook"
            >
              <Facebook className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-primary"
              onClick={() => handleShare("twitter")}
              aria-label="Share on Twitter"
              data-testid="button-share-twitter"
            >
              <Twitter className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-primary"
              onClick={() => handleShare("linkedin")}
              aria-label="Share on LinkedIn"
              data-testid="button-share-linkedin"
            >
              <Linkedin className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="mt-12 sm:mt-16 card-glass p-6 sm:p-8 md:p-10 text-center">
          <h3 className="text-[1.375rem] sm:text-[1.625rem] leading-snug font-serif font-bold mb-4 text-foreground">Need professional cleaning?</h3>
          <p className="text-muted-foreground mb-7 sm:mb-8 max-w-[30rem] mx-auto text-[15px] sm:text-base leading-relaxed">
            Let the experts at The Maine Cleaning Co. handle the dirty work so you can enjoy your free time.
          </p>
          <Link href="/#get-estimate">
            <Button size="lg" className="rounded-full px-8 shadow-sm" data-testid="button-get-quote">Get a Free Estimate</Button>
          </Link>
        </div>
      </Section>
    </>
  );
}
