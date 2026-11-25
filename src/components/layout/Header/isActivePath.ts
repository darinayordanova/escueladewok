/** Exact match for home, prefix match for sections (so /courses/x highlights Courses). */
export function isActivePath(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}
