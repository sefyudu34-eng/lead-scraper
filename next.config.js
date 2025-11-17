/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'export' ← supprimé exprès pour que les API routes fonctionnent sur Vercel
  images: {
    unoptimized: true // obligatoire quand tu avais output: 'export' avant, on le garde pour éviter les erreurs d'images
  }
};

module.exports = nextConfig;
 
 
