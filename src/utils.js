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
