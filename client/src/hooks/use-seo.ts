import { useEffect } from "react";

export function useSEO({
  title,
  description,
  base = "The Maine Cleaning Co.",
}: {
  title: string;
  description: string;
  base?: string;
}) {
  useEffect(() => {
    document.title = title ? `${title} | ${base}` : base;

    let meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", description);
    }
  }, [title, description, base]);
}
