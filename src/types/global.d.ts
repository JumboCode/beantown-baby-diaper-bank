declare module "*.css";
declare module "@mantine/core/styles.css";
declare module "@mantine/dates/styles.css";
declare module "leaflet/dist/leaflet.css";

export {};

// Create a type for the Roles
export type Roles = "superadmin" | "admin" | "user";

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles;
    };
  }
}
