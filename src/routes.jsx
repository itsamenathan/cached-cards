import App from './App.jsx'

const ruleModules = import.meta.glob('/rules/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})
const ruleSlugs = Object.keys(ruleModules).map((path) =>
  path.split('/').pop().replace(/\.md$/, ''),
)

export const routes = [
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/rules/:slug',
    element: <App />,
    getStaticPaths: () => ruleSlugs.map((slug) => `/rules/${slug}`),
  },
]
