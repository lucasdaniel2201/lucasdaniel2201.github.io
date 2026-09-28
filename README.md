# lucasdaniel2201.github.io

Site pessoal, publicado no GitHub Pages em https://lucasdaniel2201.github.io.

Feito com [Astro](https://astro.build). Cada projeto é um case study em Markdown
dentro de `src/content/projetos/`, com os dados que a listagem e a ficha técnica
precisam no frontmatter.

## Rodando

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # gera o site em dist/
npm run preview   # serve o build local
```

## Onde fica o quê

| Caminho | Função |
| ------- | ------ |
| `src/content/projetos/` | Um case study por projeto, em Markdown. |
| `src/content.config.ts` | Esquema do frontmatter dos case studies. |
| `src/layouts/Base.astro` | Cabeçalho, navegação, metadados e SEO. |
| `src/components/Topologia.astro` | O mapa de integração em SVG da página inicial. |
| `src/components/Dossie.astro` | A linha de projeto usada na listagem. |
| `src/pages/` | Página inicial, listagem de projetos, case study e sobre. |
| `src/styles/global.css` | Sistema de design: cor, tipo, espaço, estado e movimento. |
| `public/img/` | Capturas reais dos aplicativos, copiadas dos repositórios. |
| `.github/workflows/deploy.yml` | Build e publicação no GitHub Pages a cada push na `main`. |

## Publicação

O deploy é automático: qualquer push na `main` dispara o workflow, que roda
`npm run build` e publica o `dist/` no GitHub Pages. Em *Settings → Pages*, a
origem precisa estar em **GitHub Actions**.

## Licença

MIT. Veja o `LICENSE`.
