import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Fix for lucide-react module not found
    transpilePackages: ['lucide-react'],
    // Disable strict mode to avoid double rendering issues
    reactStrictMode: false,
};

export default withNextIntl(nextConfig);
