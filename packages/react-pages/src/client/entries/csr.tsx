/**
 * This is the entry for client-side-render(csr).
 * Used in: dev mode, build mode.
 */

import React from 'react'
import ReactDom from 'react-dom'

import ClientAppWrapper from './ClientAppWrapper'
import App from '../App'

ReactDom.render(
  <ClientAppWrapper>
    <App />
  </ClientAppWrapper>,
  document.getElementById('app')
)