export async function getLatestReleaseApkUrl(): Promise<string | null> {
  try {
    const res = await fetch("https://api.github.com/repos/jed1boy/Musika/releases/latest", {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (!res.ok) {
      console.error("Failed to fetch release:", res.status, res.statusText);
      return null;
    }
    
    const data = await res.json();
    const assets = data.assets || [];
    
    // Find the first asset that ends with .apk
    const apkAsset = assets.find((asset: any) => asset.name.endsWith('.apk'));
    
    if (apkAsset && apkAsset.browser_download_url) {
      return apkAsset.browser_download_url;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching GitHub release:", error);
    return null;
  }
}