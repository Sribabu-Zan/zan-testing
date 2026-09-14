import {
  Blocks,
  Brain,
  Building2,
  Clapperboard,
  Cloud,
  Code,
  Database,
  Gem,
  GraduationCap,
  HeartPulse,
  Headphones,
  Landmark,
  LayoutTemplate,
  Megaphone,
  MessageCircle,
  Monitor,
  Palette,
  Plane,
  Rocket,
  Search,
  Server,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Truck,
  Workflow,
  Globe,
  type LucideIcon,
} from "lucide-react";

/**
 * Every icon the content uses, by key. Content names an icon with a string
 * (constants/zan.ts stays plain data); components render it through
 * <ZanIcon name=… />. One import site keeps the bundle to exactly these.
 */
const ICONS = {
  code: Code,
  mobile: Smartphone,
  ai: Brain,
  blockchain: Blocks,
  cloud: Cloud,
  security: ShieldCheck,
  search: Search,
  growth: TrendingUp,
  social: MessageCircle,
  megaphone: Megaphone,
  layout: LayoutTemplate,
  gem: Gem,
  palette: Palette,
  monitor: Monitor,
  rocket: Rocket,
  support: Headphones,
  web: Globe,
  server: Server,
  data: Database,
  devops: Workflow,
  health: HeartPulse,
  finance: Landmark,
  ecommerce: ShoppingBag,
  education: GraduationCap,
  building: Building2,
  logistics: Truck,
  entertainment: Clapperboard,
  travel: Plane,
} satisfies Record<string, LucideIcon>;

export type IconKey = keyof typeof ICONS;

export function ZanIcon({
  name,
  className,
  strokeWidth = 1.6,
}: {
  name: IconKey;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
}
