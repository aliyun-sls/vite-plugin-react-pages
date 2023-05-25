/// <reference types="vite/client" />

/**
 * This is a common wrapper component for csr.tsx and ssg-client.tsx
 */

import React, { useState } from 'react'
import { Router } from 'react-router-dom'
import { createBrowserHistory } from 'history'

import { dataCacheCtx, setDataCacheCtx } from '../ctx'
import type { PageLoaded } from '../../../clientTypes'

// // @ts-expect-error
// const Router = __HASH_ROUTER__ ? HashRouter : BrowserRouter
// @ts-expect-error
const basename = __HASH_ROUTER__
  ? undefined
  : import.meta.env.BASE_URL?.replace(/\/$/, '')

const history = createBrowserHistory({
  basename,
}) // eslint-disable-line

window.sls_vite_page_history = history

interface Props {
  readonly initCache?: PageLoaded
  readonly children: React.ReactNode
}

const ClientAppWrapper: React.FC<React.PropsWithChildren<Props>> = ({
  initCache,
  children,
}) => {
  const [dataCache, setDataCache] = useState<PageLoaded>(initCache ?? {})
  return (
    <Router history={history}>
      <dataCacheCtx.Provider value={dataCache}>
        <setDataCacheCtx.Provider value={setDataCache}>
          {children}
        </setDataCacheCtx.Provider>
      </dataCacheCtx.Provider>
    </Router>
  )
}

export default ClientAppWrapper
