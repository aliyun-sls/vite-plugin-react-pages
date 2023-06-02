import React, { useContext, useMemo } from 'react'
import { Menu, Dropdown } from 'antd'
import { Link } from 'react-router-dom'
// import { matchPath } from "react-router";
import { PathPattern } from './renderMenu'
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'

import s from './index.module.less'
import { renderMenuHelper } from './renderMenu'
import type { MenuConfig } from './renderMenu'
import { LayoutContext } from './ctx'
import { themeConfigCtx, useThemeCtx } from '../ctx'
import { useLocaleSelector } from './useLocaleSelector'
import Search from './Search'

const renderMenu = renderMenuHelper(true)

interface Props {}

export function warning(cond: any, message: string) {
  if (!cond) {
    // eslint-disable-next-line no-console
    if (typeof console !== "undefined") console.warn(message);

    try {
      // Welcome to debugging history!
      //
      // This error is thrown as a convenience so you can more easily
      // find the source for a warning that appears in the console by
      // enabling "pause on exceptions" in your JavaScript debugger.
      throw new Error(message);
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
}

function safelyDecodeURIComponent(value: string, paramName: string) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    warning(
      false,
      `The value for the URL param "${paramName}" will not be decoded because` +
        ` the string "${value}" is a malformed URL segment. This is probably` +
        ` due to a bad percent encoding (${error}).`
    );

    return value;
  }
}

function compilePath(
  path: string,
  caseSensitive = false,
  end = true
): [RegExp, string[]] {
  warning(
    path === "*" || !path.endsWith("*") || path.endsWith("/*"),
    `Route path "${path}" will be treated as if it were ` +
      `"${path.replace(/\*$/, "/*")}" because the \`*\` character must ` +
      `always follow a \`/\` in the pattern. To get rid of this warning, ` +
      `please change the route path to "${path.replace(/\*$/, "/*")}".`
  );

  let paramNames: string[] = [];
  let regexpSource =
    "^" +
    path
      .replace(/\/*\*?$/, "") // Ignore trailing / and /*, we'll handle it below
      .replace(/^\/*/, "/") // Make sure it has a leading /
      .replace(/[\\.*+^$?{}|()[\]]/g, "\\$&") // Escape special regex chars
      .replace(/\/:(\w+)/g, (_: string, paramName: string) => {
        paramNames.push(paramName);
        return "/([^\\/]+)";
      });

  if (path.endsWith("*")) {
    paramNames.push("*");
    regexpSource +=
      path === "*" || path === "/*"
        ? "(.*)$" // Already matched the initial /, just match the rest
        : "(?:\\/(.+)|\\/*)$"; // Don't include the / in params["*"]
  } else if (end) {
    // When matching to the end, ignore trailing slashes
    regexpSource += "\\/*$";
  } else if (path !== "" && path !== "/") {
    // If our path is non-empty and contains anything beyond an initial slash,
    // then we have _some_ form of path in our regex so we should expect to
    // match only if we find the end of this path segment.  Look for an optional
    // non-captured trailing slash (to match a portion of the URL) or the end
    // of the path (if we've matched to the end).  We used to do this with a
    // word boundary but that gives false positives on routes like
    // /user-preferences since `-` counts as a word boundary.
    regexpSource += "(?:(?=\\/|$))";
  } else {
    // Nothing to match for "" or "/"
  }

  let matcher = new RegExp(regexpSource, caseSensitive ? undefined : "i");

  return [matcher, paramNames];
}

type _PathParam<Path extends string> =
  // split path into individual path segments
  Path extends `${infer L}/${infer R}`
    ? _PathParam<L> | _PathParam<R>
    : // find params after `:`
    Path extends `:${infer Param}`
    ? Param extends `${infer Optional}?`
      ? Optional
      : Param
    : // otherwise, there aren't any params present
      never;


type PathParam<Path extends string> =
  // check if path is just a wildcard
  Path extends "*" | "/*"
    ? "*"
    : // look for wildcard at the end of the path
    Path extends `${infer Rest}/*`
    ? "*" | _PathParam<Rest>
    : // look for params in the absence of wildcards
      _PathParam<Path>;


export type ParamParseKey<Segment extends string> =
  // if could not find path params, fallback to `string`
  [PathParam<Segment>] extends [never] ? string : PathParam<Segment>;

/**
 * The parameters that were parsed from the URL path.
 */
export type Params<Key extends string = string> = {
  readonly [key in Key]: string | undefined;
};

export interface PathMatch<ParamKey extends string = string> {
  /**
   * The names and values of dynamic parameters in the URL.
   */
  params: Params<ParamKey>;
  /**
   * The portion of the URL pathname that was matched.
   */
  pathname: string;
  /**
   * The portion of the URL pathname that was matched before child routes.
   */
  pathnameBase: string;
  /**
   * The pattern that was used to match.
   */
  pattern: PathPattern;
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

function matchPath<
  ParamKey extends ParamParseKey<Path>,
  Path extends string
>(
  pattern: PathPattern<Path> | Path,
  pathname: string
): PathMatch<ParamKey> | null {
  if (typeof pattern === "string") {
    pattern = { path: pattern, caseSensitive: false, end: true };
  }

  let [matcher, paramNames] = compilePath(
    pattern.path,
    pattern.caseSensitive,
    pattern.end
  );
  let match = pathname.match(matcher);
  if (!match) return null;

  let matchedPathname = match[0];
  let pathnameBase = matchedPathname.replace(/(.)\/+$/, "$1");
  let captureGroups = match.slice(1);
  let params: Params = paramNames.reduce<Mutable<Params>>(
    (memo, paramName, index) => {
      // We need to compute the pathnameBase here using the raw splat value
      // instead of using params["*"] later because it will be decoded then
      if (paramName === "*") {
        let splatValue = captureGroups[index] || "";
        pathnameBase = matchedPathname
          .slice(0, matchedPathname.length - splatValue.length)
          .replace(/(.)\/+$/, "$1");
      }

      memo[paramName] = safelyDecodeURIComponent(
        captureGroups[index] || "",
        paramName
      );
      return memo;
    },
    {}
  );
    // console.log(params, pathname,pattern)
  return {
    params,
    pathname: matchedPathname,
    pathnameBase,
    pattern,
  };
}

const AppHeader: React.FC<React.PropsWithChildren<Props>> = (props) => {
  const themeConfig = useContext(themeConfigCtx)
  const { TopBarExtra, topNavs } = themeConfig
  const layoutCtxVal = useContext(LayoutContext)
  const { render: renderLocaleSelector } = useLocaleSelector()
  const themeCtxValue = useThemeCtx()
  const {
    loadState: { routePath },
    resolvedLocale: { locale, localeKey },
    staticData,
  } = themeCtxValue

  const renderLogo = (() => {
    const logoLink = (() => {
      let result: string | undefined | null
      if (typeof themeConfig.logoLink === 'function') {
        result = themeConfig.logoLink(themeCtxValue)
      } else {
        result = themeConfig.logoLink
      }
      if (result === undefined) {
        // infer home page path based on current matched locale
        // for example, /page1 will infer home path to /
        // /zh/page1 will infer home path to /zh
        result = locale?.routePrefix || '/'
        // if the infered page path doesn't exist, drop it
        if (!staticData[result]) result = null
      }
      return result
    })()
    const resolvedLogo = (() => {
      if (typeof themeConfig.logo === 'function')
        return themeConfig.logo(themeCtxValue)
      return themeConfig.logo
    })()
    if (logoLink) {
      return (
        <Link to={logoLink} className={s.logoLink}>
          {resolvedLogo}
        </Link>
      )
    }
    return resolvedLogo
  })()

  const resolvedTopNavs = useMemo(() => {
    if (typeof topNavs === 'function') return topNavs(themeCtxValue)
    return topNavs
  }, [themeCtxValue])

  const activeKeys: string[] = useMemo(() => {
    const result = (resolvedTopNavs ?? [])
      .map(getActiveKeyIfMatch)
      .filter(Boolean)
    if (!result.includes(routePath)) result.push(routePath)
    return result as string[]

    function getActiveKeyIfMatch(item: MenuConfig) {
      if ('path' in item) {
        const matcher =
          item.activeIfMatch ??
          ({
            path: item.path,
            // if activeIfMatch is not given,
            // do exact match by default
            end: true,
          } as PathPattern<string>)
        const matchResult = matchUtil(matcher)
        if (matchResult) return item.path
      } else if ('subMenu' in item) {
        if (item.activeIfMatch) {
          const matchResult = matchUtil(item.activeIfMatch)
          if (matchResult) return item.subMenu
        }
        const childrenMatchResult = item.children.some(getActiveKeyIfMatch)
        if (childrenMatchResult) return item.subMenu
      }
      return false

      function matchUtil(
        matcher: string | string[] | PathPattern<string> | PathPattern<string>[]
      ): boolean {
        if (!Array.isArray(matcher)) {
          let actualMatcher: PathPattern<string>
          if (typeof matcher === 'string') {
            actualMatcher = {
              path: matcher,
              // if users pass activeIfMatch as string
              // do prefix match (instead of exact match)
              end: false,
            }
          } else {
            actualMatcher = matcher
          }
          // use loadState.routePath instead of location.pathname
          // because location.pathname may contain trailing slash
          // console.log(routePath)
          return !!matchPath(actualMatcher.path, routePath)
        } else {
          return matcher.some((oneMatcher) => {
            return !!matchPath(oneMatcher as any, routePath)
          })
        }
      }
    }
  }, [routePath, resolvedTopNavs])

  return (
    <header className={s.header}>
      <div className={s.triggerCtn}>
        <span
          className={s.trigger}
          onClick={() => {
            layoutCtxVal.setIsSlideSiderOpen((v) => !v)
          }}
        >
          {React.createElement(
            layoutCtxVal.isSlideSiderOpen
              ? MenuUnfoldOutlined
              : MenuFoldOutlined
          )}
        </span>
      </div>
      <div className={s.logoArea}>{renderLogo}</div>

      {themeConfig.search && (
        <div className={s.searchArea}>
          <Search />
        </div>
      )}

      <div className={s.flexSpace}></div>

      {resolvedTopNavs && (
        <>
          <div className={s.navCtn}>
            <Menu
              className={s.nav}
              mode="horizontal"
              selectedKeys={activeKeys}
              disabledOverflow
              items={renderMenu(resolvedTopNavs, true)}
            />
          </div>
          <div className={s.triggerCtn}>
            <Dropdown
              placement="bottomRight"
              menu={{
                selectedKeys: activeKeys,
                disabledOverflow: true,
                items: renderMenu(resolvedTopNavs, true),
              }}
            >
              <span className={s.trigger}>
                <UnorderedListOutlined />
              </span>
            </Dropdown>
          </div>
        </>
      )}

      <div className={s.localeSelectorCtn}>{renderLocaleSelector()}</div>

      {TopBarExtra ? (
        <div className={s.extraCtn}>
          <TopBarExtra />
        </div>
      ) : (
        <div className={s.alignNavWithContent}></div>
      )}
    </header>
  )
}

export default AppHeader
