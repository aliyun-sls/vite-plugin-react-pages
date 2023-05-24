import React from 'react'
import {
  useLocation,
  Switch,
  Route
} from 'react-router-dom'
import {type Location } from 'history'
import { usePagePaths } from './state'
import PageLoader from './PageLoader'

const App = () => {
  const pageRoutes = usePagePaths()
    .filter((path) => path !== '/404')
    .map((path) => {
      return { path, element: <PageLoader routePath={path} /> } 
    })
    
  pageRoutes.push({
    path: '*',
    element: (
      <UseLocation>
        {(location) => <PageLoader routePath={location.pathname} />}
      </UseLocation>
    )
  })
  console.log(pageRoutes)
  return (
    <Switch>
      {
        pageRoutes.map((path) => {
          return (
            <Route key={path.path} path={path.path} render={() => path.element} />
          )
        })
      }
    </Switch>
  )
}

export default App

function UseLocation({ children }: { children: (location: Location) => any }) {
  const location = useLocation()
  // console.log('###UseLocation', location)
  return children(location)
}

function unflatten( pageRoutes: { path: string; element: JSX.Element;}[]){
  
}
