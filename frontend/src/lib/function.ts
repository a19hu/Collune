const rootDomains = ['spsystems.in'];

export const getSubdomainFromHostname = (hostname: string) => {
    const normalizedHostname = hostname.toLowerCase();
    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(normalizedHostname)) return '';
    if (rootDomains.includes(normalizedHostname)) return '';
    if (rootDomains.some((domain) => normalizedHostname === `www.${domain}`)) return '';
    if (normalizedHostname.endsWith('.localhost')) {
        return normalizedHostname.replace('.localhost', '').split('.').pop() || '';
    }
    const matchedRoot = rootDomains.find((domain) => normalizedHostname.endsWith(`.${domain}`));
    if (matchedRoot) {
        return normalizedHostname.slice(0, -(matchedRoot.length + 1)).split('.').pop() || '';
    }
    return '';
};

export const getMainSiteUrl = (hostname: string) => {
    const { protocol, port, origin } = window.location;
    const portSuffix = port ? `:${port}` : '';
    const normalizedHostname = hostname.toLowerCase();

    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(normalizedHostname)) return origin;
    if (normalizedHostname.endsWith('.localhost')) return `${protocol}//schoolmate.localhost${portSuffix}`;

    const matchedRoot = rootDomains.find(
        (domain) => normalizedHostname === domain || normalizedHostname.endsWith(`.${domain}`),
    );
    if (matchedRoot) return `${protocol}//schoolmate.${matchedRoot}`;

    return origin;
};