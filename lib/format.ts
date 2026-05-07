const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

export function formatPercent(value: number): string {
  return percentFormatter.format(value);
}

export function shortRepoName(repoUrl: string): string {
  return repoUrl.replace(/^[a-z][a-z\d+\-.]*:\/\/[^/]+\/?/i, "").replace(/\.git$/i, "");
}
