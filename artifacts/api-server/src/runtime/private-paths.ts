export function privatePath(url: string): boolean {
  let path = url.split("?")[0];
  try {
    for (let i = 0; i < 3; i++) {
      const decoded = decodeURIComponent(path);
      if (decoded === path) break;
      path = decoded;
    }
  } catch { return true; }
  return path.replace(/\\/g, "/").split("/").some(segment =>
    [".local", ".agents", ".git", "generated-artifacts", "@fs"].includes(segment) || /^\.env(?:\.|$)/.test(segment));
}
