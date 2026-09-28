import { defineConfig } from 'astro/config';

// Site de usuário do GitHub Pages: publicado na raiz do domínio
// lucasdaniel2201.github.io, entao nao existe `base` para configurar.
export default defineConfig({
  site: 'https://lucasdaniel2201.github.io',
  output: 'static',
  build: {
    format: 'directory',
  },
});
