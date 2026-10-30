import type { NextConfig } from 'next'

// Em projetos do GitHub Pages o site fica em https://usuario.github.io/<repo>/,
// então o basePath precisa ser o nome do repositório. O workflow define
// NEXT_PUBLIC_BASE_PATH automaticamente; localmente fica vazio.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
}

export default nextConfig
