export const blogPosts = [
  {
    id: "spring-cleaning-checklist",
    title: "The Ultimate Southern Maine Spring Cleaning Checklist",
    excerpt: "Get your home ready for the warmer months with our comprehensive spring cleaning guide tailored for Maine homes.",
    date: "March 15, 2026",
    category: "Cleaning Tips",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop",
    content: `
      Spring in Maine is a time of renewal, and there's no better way to celebrate than by giving your home a fresh start. After a long winter of closed windows and muddy boots, a deep spring cleaning is essential.
      
      Here is our professional checklist to ensure you don't miss a spot:
      
      ### 1. The Windows
      Start by washing all windows inside and out. Remove screens and wash them with soapy water. Don't forget to wipe down the window tracks where dead bugs and dirt accumulate over the winter.
      
      ### 2. Baseboards and Trims
      These areas are magnets for dust and pet hair. Use a damp microfiber cloth with a mild cleaner to wipe down all baseboards, door frames, and window trims.
      
      ### 3. Deep Clean Carpets and Rugs
      Maine winters mean a lot of salt and sand getting tracked inside. Vacuum thoroughly and consider hiring a professional for hot water extraction to prolong the life of your carpets.
      
      ### 4. Kitchen Appliances
      Pull out the refrigerator and stove to clean underneath and behind them. Clean the oven, descale the dishwasher, and wipe down the inside of the fridge.
      
      ### 5. Rotate Wardrobes
      Pack away the heavy winter coats and bring out the spring wardrobe. Take this opportunity to donate items you no longer wear.
      
      Need help tackling this list? The Maine Cleaning Co. offers comprehensive Deep Cleaning services that cover all these bases and more!
    `
  },
  {
    id: "why-we-choose-melaleuca",
    title: "Why We Clean With Melaleuca EcoSense & Sal Suds",
    excerpt: "Discover why we're committed to using premium, eco-friendly products that are safe for your family and pets.",
    date: "February 28, 2026",
    category: "Company News",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=600&fit=crop",
    content: `
      At The Maine Cleaning Co., we believe that a clean home shouldn't come at the cost of your health or the environment. That's why we've made the conscious decision to exclusively use premium, eco-friendly products.
      
      ### The Power of Melaleuca EcoSense
      Melaleuca's EcoSense line uses the power of nature, particularly Melaleuca oil (tea tree oil), to clean effectively without harsh chemicals. These products are:
      - Free of chlorine bleach
      - Free of ammonia
      - Free of formaldehyde
      - Safe to use around children and pets
      
      ### Sal Suds: The Biodegradable Wonder
      Dr. Bronner's Sal Suds Biodegradable Cleaner is our go-to for tough jobs. It's a concentrated hard-surface all-purpose cleaner made with plant-based surfactants and natural fir needle and spruce essential oils. It cleans with exceptional power but is mild and gentle on the skin, and completely biodegradable.
      
      ### The Impact on Your Home
      By using these products, we ensure that the air quality in your home remains pure. You won't return to a house that smells like a chemical factory; instead, you'll walk into a space that feels genuinely fresh and naturally clean.
      
      When you book with us, you're not just getting a clean home—you're getting a safe home.
    `
  },
  {
    id: "preparing-airbnb-summer",
    title: "How to Prepare Your Vacation Rental for the Summer Rush",
    excerpt: "Essential tips for Airbnb and VRBO hosts in Southern Maine to maximize bookings and ensure 5-star reviews.",
    date: "January 10, 2026",
    category: "Vacation Rentals",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    content: `
      Summer in Southern Maine is the peak season for vacation rentals. With tourists flocking to Portland, Cape Elizabeth, and the surrounding coastal towns, your Airbnb or VRBO needs to be in top shape to secure those coveted 5-star reviews.
      
      Here's how to prepare:
      
      ### 1. Perform a Deep Inventory Check
      Go through the entire property. Are there enough plates, glasses, and silverware for your maximum occupancy? Are the pots and pans in good condition? Replace anything chipped, stained, or broken.
      
      ### 2. Upgrade the Linens
      Nothing says "luxury" like fresh, high-quality linens. If your sheets and towels are looking dingy after last season, it's time to replace them. Opt for crisp, white linens—they are easier to bleach and always look clean.
      
      ### 3. Schedule a Pre-Season Deep Clean
      Before the first guest arrives, the property needs a thorough deep clean. This is the time to wash curtains, clean behind appliances, steam carpets, and scrub the outdoor grill. 
      
      ### 4. Create a Flawless Turnover System
      During the summer rush, you might have guests checking out at 11 AM and new ones arriving at 3 PM. You need a reliable, efficient turnover process. 
      
      ### Partner with Professionals
      The easiest way to ensure your property is always guest-ready is to partner with a professional cleaning service that specializes in vacation rentals. The Maine Cleaning Co. offers rapid, flawless turnover services complete with damage reporting and consumable restocking. Let us handle the cleaning so you can focus on being a great host!
    `
  }
];

export const getBlogPosts = () => blogPosts;
export const getBlogPostById = (id: string) => blogPosts.find(post => post.id === id);
