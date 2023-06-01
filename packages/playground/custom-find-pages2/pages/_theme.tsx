import { createTheme } from '@aliyun-sls/vite-pages-theme-doc'

export default createTheme({
  topNavs: [
    { label: 'index', path: '/',
    // activeIfMatch: {
    //   // path: '/:foo',
    //   // caseSensitive: false,
    //   end:true
    // } 
  },
    { label: 'sub-path', path: '/sub-path', activeIfMatch: {
      path: '/sub-path/:foo',
      // caseSensitive: false,
      // end:true
    } },
    { label: 'Vite', href: 'https://github.com/vitejs/vite' },
    {
      label: 'Vite Pages',
      href: 'https://github.com/vitejs/vite-plugin-react-pages',
    },
  ],
  logo: 'Vite Pages',
})
