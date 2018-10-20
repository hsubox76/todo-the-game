export function getQueryParams() {
    return window.location.search
      .substring(1)
      .split('&')
      .reduce((pairs, pairString) => {
        const [key, val] = pairString.split('=');
        pairs[key] = val;
        return pairs;
      }, {});
}

export function updateQueryString(params) {
  const currentParams = getQueryParams();
  const newParams = Object.assign(currentParams, params);
  const paramPairs = [];
  for (const key in newParams) {
    if (key) {
      paramPairs.push(`${key}=${currentParams[key]}`);
    }
  }
  return paramPairs.join('&');
}
