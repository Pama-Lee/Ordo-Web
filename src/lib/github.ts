// Build-time helpers for pulling live data from the Ordo GitHub repo, so the
// marketing site stays in sync with releases without manual edits. These run in
// Astro frontmatter (at build), mirroring the star-count fetch in Navbar.astro.
// Each has a hardcoded fallback so an API hiccup or rate limit (unauthenticated
// GitHub API is 60 req/hr/IP) never breaks the build.

const REPO = 'Ordo-Engine/Ordo';

/** Latest published release version, without the leading `v` (e.g. `0.5.2`). */
export async function getLatestVersion(fallback = '0.5.2'): Promise<string> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (res.ok) {
      const tag = (await res.json())?.tag_name as string | undefined;
      const cleaned = tag?.replace(/^v/, '').trim();
      if (cleaned) return cleaned;
    }
  } catch {
    // fall through to fallback
  }
  return fallback;
}
