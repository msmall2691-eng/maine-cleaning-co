import { getBlogPosts } from "@/lib/blog-data";
import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { photos } from "@/lib/photos";

export default function Blog() {
  useSEO({ title: "Journal & Insights", description: "Cleaning tips, home maintenance advice, and short-term rental insights from The Maine Cleaning Co. — Southern Maine's trusted cleaning experts." });
  const posts = getBlogPosts();

  return (
    <>
      {/* Header and grid now share one measure (`wide`). The old header was
          max-w-4xl over a max-w-6xl grid, so the page's own title read as
          narrower than the cards under it. The hero photo used to sit behind
          the text at opacity 0.05 — invisible, and a near-duplicate of the
          library's rental-bathroom shot; it's a real photograph now, beside
          the heading rather than ghosted under it. */}
      <Section
        measure="wide"
        rhythm="none"
        reveal={false}
        className="pt-28 sm:pt-36 lg:pt-40 pb-[clamp(2rem,3.5vw,3rem)] overflow-hidden"
      >
        <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-10 lg:gap-14 items-center">
          <div>
            <h1
              className="text-[2.25rem] sm:text-5xl md:text-[3.5rem] leading-[1.05] font-serif font-bold tracking-[-0.02em] text-foreground heading-rule-left"
              data-testid="text-blog-heading"
            >
              Journal & Insights
            </h1>
            <p className="mt-8 text-[15px] sm:text-base text-muted-foreground leading-relaxed max-w-[34rem]">
              Cleaning tips, company news, and insights for maintaining a beautiful home or business in Southern Maine.
            </p>
          </div>

          <figure className="photo-frame hidden lg:block aspect-[4/3]">
            <img
              src={photos.rentalBathroom.src}
              alt={photos.rentalBathroom.alt}
              loading="lazy"
              decoding="async"
            />
          </figure>
        </div>
      </Section>

      <Section measure="wide" rhythm="default">
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

              <div className="p-5 sm:p-7 flex flex-col flex-grow">
                <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground font-medium mb-3 sm:mb-4">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
                </div>

                <Link href={`/blog/${post.id}`}>
                  <h3 className="text-lg sm:text-xl leading-snug font-serif font-bold mb-3 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                </Link>

                <p className="text-sm sm:text-[15px] text-muted-foreground mb-5 sm:mb-6 flex-grow line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>

                <Link href={`/blog/${post.id}`}>
                  <span className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors" data-testid={`link-read-${post.id}`}>
                    Read Article <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>
    </>
  );
}
