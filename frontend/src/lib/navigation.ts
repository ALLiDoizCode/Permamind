/**
 * Navigation utilities for constructing routes and URLs
 *
 * These helpers construct URLs for React Router navigation.
 * Use with useNavigate() from react-router-dom:
 *
 * @example
 * const navigate = useNavigate();
 * navigate(navigateToSearch('blockchain'));
 */

/**
 * Construct search results URL with query parameter
 *
 * @param query - Search query text
 * @returns URL path for search results page
 *
 * @example
 * navigateToSearch('blockchain') // => '/search?q=blockchain'
 */
export function navigateToSearch(query: string): string {
  const encodedQuery = encodeURIComponent(query.trim());
  return `/search?q=${encodedQuery}`;
}

/**
 * Construct search results URL with tag filter
 *
 * @param tag - Tag/category to filter by
 * @returns URL path for filtered search results
 *
 * @example
 * navigateToSearchByTag('ao') // => '/search?tag=ao'
 */
export function navigateToSearchByTag(tag: string): string {
  const encodedTag = encodeURIComponent(tag.trim());
  return `/search?tag=${encodedTag}`;
}

/**
 * Construct skill detail URL
 *
 * @param skillName - Name of the skill
 * @returns URL path for skill detail page
 *
 * @example
 * navigateToSkill('aoconnect') // => '/skills/aoconnect'
 */
export function navigateToSkill(skillName: string): string {
  const encodedName = encodeURIComponent(skillName.trim());
  return `/skills/${encodedName}`;
}

/**
 * Construct homepage URL
 *
 * @returns URL path for homepage
 *
 * @example
 * navigateToHome() // => '/'
 */
export function navigateToHome(): string {
  return '/';
}

/**
 * Construct all skills search URL (no filters)
 *
 * @returns URL path for all skills
 *
 * @example
 * navigateToAllSkills() // => '/search'
 */
export function navigateToAllSkills(): string {
  return '/search';
}
