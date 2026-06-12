import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calendar,
  ClipboardList,
  Dumbbell,
  Home,
  LayoutDashboard,
  LogIn,
  Shield,
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
    title: "Usuario",
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
        href: "/dashboard",
        label: "Mis rutinas",
        eyebrow: "Dashboard",
        description: "Consulta tus rutinas guardadas y elige la activa.",
        section: "Usuario",
        icon: LayoutDashboard,
      },
      {
        href: "/dashboard/rutinas",
        label: "Semana activa",
        eyebrow: "Rutina activa",
        description: "Abre la rutina semanal del entrenamiento actual.",
        section: "Usuario",
        icon: Calendar,
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        href: "/admin",
        label: "Dashboard Admin",
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

const shellRouteMetas: ShellRouteMeta[] = [
  {
    href: "/",
    label: "Inicio",
    eyebrow: "Shell base",
    description: "Base visual compartida para el MVP de GymControl.",
    section: "Base",
    icon: Home,
  },
  ...shellNavigationGroups.flatMap((group) => group.items),
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
