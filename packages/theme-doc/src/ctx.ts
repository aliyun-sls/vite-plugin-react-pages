import { createContext, useContext } from 'react'
import type { ThemeConfig, ThemeContextValue } from '.'
import type { ThemeProps } from '@aliyun-sls/vite-plugin-react-pages/clientTypes'

export const themeConfigCtx = createContext<ThemeConfig>({})
export const themePropsCtx = createContext<ThemeProps>({
  loadState: { type: 'loading', routePath: '/' },
  loadedData: {},
})
export const themeCtx = createContext<ThemeContextValue>({} as any)
export function useThemeCtx() {
  return useContext(themeCtx)
}
