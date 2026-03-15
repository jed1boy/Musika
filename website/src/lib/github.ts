export async function getLatestReleaseApkUrl(): Promise<string | null> {
  try {
    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(
      "https://api.github.com/repos/jed1boy/Musika/releases/latest",
      { next: { revalidate: 300 }, headers }
    );

    if (!res.ok) {
      console.error("Failed to fetch release:", res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    const assets: Array<{ name: string; browser_download_url: string }> =
      data.assets ?? [];

    const apkAsset = assets.find((a) => a.name.endsWith(".apk"));

    return apkAsset?.browser_download_url ?? null;
  } catch (error) {
    console.error("Error fetching GitHub release:", error);
    return null;
  }
}
