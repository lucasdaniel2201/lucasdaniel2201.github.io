import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Cada projeto e um case study em Markdown, com os dados que a listagem e a
// ficha tecnica precisam. O corpo do Markdown e o texto longo.
const projetos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projetos' }),
  schema: z.object({
    titulo: z.string(),
    resumo: z.string(),
    papel: z.string(),
    periodo: z.string(),
    stack: z.array(z.string()),
    repo: z.string().url(),
    release: z.string().url(),
    ordem: z.number(),
    metricas: z.array(
      z.object({
        valor: z.string(),
        rotulo: z.string(),
      }),
    ),
    imagem: z.string(),
    imagemAlt: z.string(),
    // Imagens extras do case study. A `imagem` acima e a capa (tambem usada na
    // listagem); a galeria sao as telas de apoio, na ordem em que aparecem.
    galeria: z.array(z.object({ src: z.string(), alt: z.string() })).default([]),
    ficha: z.array(
      z.object({
        rotulo: z.string(),
        valor: z.string(),
      }),
    ),
  }),
});

export const collections = { projetos };
