import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  // Fija la raíz del workspace en ESTE directorio: con git worktrees hay
  // lockfiles anidados y Turbopack puede inferir la raíz equivocada (mezcla
  // dos node_modules → dos copias de React → la página no hidrata).
  turbopack: { root: __dirname },
};

export default withSerwist(nextConfig);
