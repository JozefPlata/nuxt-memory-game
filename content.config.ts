import { defineContentConfig, defineCollection, z } from '@nuxt/content';

export default defineContentConfig({
    collections: {
        content: defineCollection({
            type: 'data',
            source: '**/items-data.json',
            schema: z.object({
                items: z.array({
                    rarity: z.number(),
                    img: z.string(),
                })
            })
        })
    }
})
