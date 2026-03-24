"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building,
  Clock,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  LayoutDashboard,
  MapPin,
  Palette,
  PenTool,
  QrCode,
  Settings,
  Shield,
  Type,
  Users,
  UserCheck,
  Wrench,
} from "lucide-react";

export type DashboardMenuItem =
  | {
    kind: "separator";
    text: string;
    allowedRoles?: string[];
  }
  | {
    kind: "link";
    label: string;
    icon: LucideIcon;
    href: string;
    allowedRoles?: string[];
  };

export const dashboardMenuItems: DashboardMenuItem[] = [
  { kind: "link", label: "Resumen", icon: LayoutDashboard, href: "/dashboard" },
  {
    kind: "link",
    label: "Reportes",
    icon: BarChart3,
    href: "/dashboard/reports",
    allowedRoles: ["administrator", "coordinator"],
  },
  {
    kind: "separator",
    text: "Configuracion Institucional",
    allowedRoles: ["administrator"],
  },
  {
    kind: "link",
    label: "Recintos",
    icon: MapPin,
    href: "/dashboard/campuses",
    allowedRoles: ["administrator"],
  },
  {
    kind: "link",
    label: "Areas Academicas",
    icon: Building,
    href: "/dashboard/academic-areas",
    allowedRoles: ["administrator"],
  },
  {
    kind: "link",
    label: "Tipos de Certificado",
    icon: Type,
    href: "/dashboard/certificate-types",
    allowedRoles: ["administrator"],
  },
  {
    kind: "link",
    label: "Catalogo de Roles",
    icon: Shield,
    href: "/dashboard/roles",
    allowedRoles: ["administrator"],
  },
  {
    kind: "link",
    label: "Firmantes Autorizados",
    icon: UserCheck,
    href: "/dashboard/signers",
    allowedRoles: ["administrator"],
  },
  {
    kind: "link",
    label: "Gestor de Medios",
    icon: ImageIcon,
    href: "/dashboard/media",
    allowedRoles: ["administrator", "coordinator"],
  },
  {
    kind: "separator",
    text: "Gestion Academica",
    allowedRoles: ["administrator", "coordinator", "verifier"],
  },
  {
    kind: "link",
    label: "Programas",
    icon: GraduationCap,
    href: "/dashboard/programs",
    allowedRoles: ["administrator", "coordinator"],
  },
  {
    kind: "link",
    label: "Participantes",
    icon: Users,
    href: "/dashboard/graduates",
    allowedRoles: ["administrator", "coordinator", "verifier"],
  },
  { kind: "separator", text: "Gestion de Certificados" },
  {
    kind: "link",
    label: "Certificados",
    icon: FileText,
    href: "/dashboard/certificates",
  },
  {
    kind: "link",
    label: "Validar QR",
    icon: QrCode,
    href: "/dashboard/validate",
  },
  {
    kind: "link",
    label: "Estados",
    icon: Clock,
    href: "/dashboard/certificate-states",
    allowedRoles: ["administrator", "coordinator"],
  },
  {
    kind: "link",
    label: "Firmas Digitales",
    icon: PenTool,
    href: "/dashboard/digital-signatures",
    allowedRoles: ["administrator", "signer"],
  },
  {
    kind: "link",
    label: "Plantillas de Diseno",
    icon: Palette,
    href: "/dashboard/certificate-templates",
    allowedRoles: ["administrator", "coordinator"],
  },
  {
    kind: "separator",
    text: "Administracion",
    allowedRoles: ["administrator"],
  },
  {
    kind: "link",
    label: "Usuarios del Sistema",
    icon: Users,
    href: "/dashboard/users",
    allowedRoles: ["administrator"],
  },
  {
    kind: "link",
    label: "Perfil y Operacion",
    icon: Settings,
    href: "/dashboard/settings",
    allowedRoles: ["administrator"],
  },
  ...(process.env.NODE_ENV === "development"
    ? [
      {
        kind: "separator" as const,
        text: "Desarrollo",
        allowedRoles: ["administrator"],
      },
      {
        kind: "link" as const,
        label: "Dev Tools",
        icon: Wrench,
        href: "/dashboard/dev-tools",
        allowedRoles: ["administrator"],
      },
    ]
    : []),
];

export const mobileQuickLinkOrder = [
  "/dashboard",
  "/dashboard/certificates",
  "/dashboard/graduates",
  "/dashboard/settings",
  "/dashboard/validate",
  "/dashboard/programs",
  "/dashboard/reports",
] as const;
