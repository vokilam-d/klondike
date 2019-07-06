import axios from 'axios';

export function dynamicModuleResolver(slug: string = 'not-found') {
  return () => axios.get(`http://localhost:3500/api/pages/${slug}`)
      .then(res => {
        const pageType = res.data;

        return import(`../pages/${pageType}/${pageType}.module`)
          .then(module => {
            const keys = Object.keys(module);
            return module[keys[0]];
          })
          .catch(() => {
            console.warn(`Lazy load of module '${pageType}' failed. Loading Not found...`);
            return import('../pages/not-found/not-found.module').then(m => m.NotFoundModule);
          });
      })
      .catch(() => import('../pages/not-found/not-found.module').then(m => m.NotFoundModule))
}
