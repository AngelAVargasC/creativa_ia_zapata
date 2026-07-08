/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Rutas tipadas: el enlazado interno se valida en tiempo de compilacion.
  typedRoutes: true,
  experimental: {
    // El diseño de un post lleva imágenes en base64 (fondos IA, foto del auto),
    // así que el body del Server Action de guardado supera el límite de 1MB.
    // TODO: mover imágenes a R2 y dejar el JSON ligero para bajar esto de nuevo.
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
};

export default nextConfig;
