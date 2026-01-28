import { defineCollection, z } from 'astro:content';


const blog = defineCollection({
  type: 'content',
  schema: ({ image }: { image: any }) => z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    author: z.string(),
    categories: z.array(z.string()),
    description: z.string(),
    image: image().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { blog };
