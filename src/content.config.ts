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
    // Opcionais: nem todo projeto tem repositorio publico. Trabalho entregue a
    // cliente entra como case study, sem link de codigo.
    repo: z.string().url().optional(),
    release: z.string().url().optional(),
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
    // `enquadramento: natural` existe para captura muito larga e baixa, que
    // ficaria perdida dentro da moldura de proporcao fixa.
    galeria: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
          enquadramento: z.enum(['moldura', 'natural']).default('moldura'),
        }),
      )
      .default([]),
    ficha: z.array(
      z.object({
        rotulo: z.string(),
        valor: z.string(),
      }),
    ),
  }),
});

export const collections = { projetos };
