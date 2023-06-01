import { createTheme } from '@aliyun-sls/vite-pages-theme-doc'

export default createTheme({
  topNavs: [
    { label: 'index', path: '/',
    activeIfMatch:{
      path:'/',
      // caseSensitive: false,
      // end: true,
    } },
    { label: 'Vite', 
      path:'/vite',
      activeIfMatch: '/vite'
    },
    {
      label: 'Vite Pages',
      href: 'https://github.com/vitejs/vite-plugin-react-pages',
    },
  ],
  logo: 'Vite Pages',
})
