import { useEffect } from "react";

export function useSEO({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  useEffect(() => {
    const base = "The Maine Cleaning Co.";
    document.title = title ? `${title} | ${base}` : base;

    let meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", description);
    }
  }, [title, description]);
}
