import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calendar,
  ChefHat,
  ClipboardList,
  Dumbbell,
  Home,
  LogIn,
  Salad,
  Settings,
  Shield,
  UtensilsCrossed,
} from "lucide-react";

export type ShellRouteMeta = {
  href: string;
  label: string;
  eyebrow: string;
  description: string;
  section: "Usuario" | "Admin" | "Acceso" | "Base";
  icon: LucideIcon;
};

export type NavigationGroup = {
  title: string;
  items: ShellRouteMeta[];
};

export const shellNavigationGroups: NavigationGroup[] = [
  {
    title: "Entrenamiento",
    items: [
      {
        href: "/catalogo",
        label: "Catálogo",
        eyebrow: "Catálogo",
        description: "Explora rutinas disponibles y prepara el guardado.",
        section: "Usuario",
        icon: BookOpen,
      },
      {
        href: "/rutinas",
        label: "Semana activa",
        eyebrow: "Rutina activa",
        description: "Abre la rutina semanal del entrenamiento actual.",
        section: "Usuario",
        icon: Calendar,
      },
    ],
  },
  {
    title: "Nutrición",
    items: [
      {
        href: "/alimentos",
        label: "Alimentos",
        eyebrow: "Alimentos",
        description: "Explora alimentos, calorías y macronutrientes.",
        section: "Usuario",
        icon: Salad,
      },
      {
        href: "/recetas",
        label: "Recetas",
        eyebrow: "Recetas",
        description: "Descubre recetas armadas con el catálogo de alimentos.",
        section: "Usuario",
        icon: ChefHat,
      },
      {
        href: "/nutricion/registro",
        label: "Registro diario",
        eyebrow: "Nutrición",
        description: "Anotá tus comidas del día y seguí tu adherencia.",
        section: "Usuario",
        icon: UtensilsCrossed,
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        href: "/admin",
        label: "Panel Admin",
        eyebrow: "Admin",
        description: "Gestiona rutinas y ejercicios sin salir del shell común.",
        section: "Admin",
        icon: Shield,
      },
      {
        href: "/admin/ejercicios",
        label: "Ejercicios",
        eyebrow: "Catálogo admin",
        description: "Crea y edita ejercicios para alimentar rutinas.",
        section: "Admin",
        icon: Dumbbell,
      },
      {
        href: "/admin/rutinas",
        label: "Rutinas",
        eyebrow: "Builder admin",
        description: "Crea y edita plantillas semanales completas.",
        section: "Admin",
        icon: ClipboardList,
      },
      {
        href: "/admin/alimentos",
        label: "Alimentos",
        eyebrow: "Catálogo admin",
        description: "Administra el catálogo de alimentos y sus macros.",
        section: "Admin",
        icon: Salad,
      },
      {
        href: "/admin/recetas",
        label: "Recetas",
        eyebrow: "Catálogo admin",
        description: "Administra el catálogo de recetas y sus ingredientes.",
        section: "Admin",
        icon: ChefHat,
      },
    ],
  },
];

export const shellUtilityLinks: ShellRouteMeta[] = [
  {
    href: "/auth/login",
    label: "Acceso",
    eyebrow: "Sesión",
    description: "Reserva el punto de entrada para auth y control por rol.",
    section: "Acceso",
    icon: LogIn,
  },
];

export const shellSecondaryLinks: ShellRouteMeta[] = [
  {
    href: "/configuracion",
    label: "Configuración",
    eyebrow: "Configuración",
    description: "Configurá tu perfil, tu objetivo nutricional y tu cuenta.",
    section: "Usuario",
    icon: Settings,
  },
];

const shellRouteMetas: ShellRouteMeta[] = [
  {
    href: "/",
    label: "Inicio",
    eyebrow: "Inicio",
    description: "Consulta tus rutinas guardadas y elige la activa.",
    section: "Base",
    icon: Home,
  },
  ...shellNavigationGroups.flatMap((group) => group.items),
  ...shellSecondaryLinks,
  ...shellUtilityLinks,
];

function matchesPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function resolveShellRouteMeta(pathname: string): ShellRouteMeta {
  const match = [...shellRouteMetas]
    .sort((left, right) => right.href.length - left.href.length)
    .find((item) => matchesPath(pathname, item.href));

  return match ?? shellRouteMetas[0];
}
