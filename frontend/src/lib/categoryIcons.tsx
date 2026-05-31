import {
  BatteryCharging,
  Boxes,
  Cable,
  CircuitBoard,
  Cog,
  Cpu,
  Gauge,
  Lightbulb,
  type LucideIcon,
  Plug,
  Radar,
  Radio,
  Speaker,
  Sun,
  Thermometer,
  Wifi,
  Wrench,
  Zap,
} from "lucide-react";

// Curated map of the icon names used by categories. Importing only these
// (instead of `import * as Icons from "lucide-react"`) keeps the bundle small.
// Add new entries here when an admin introduces a category with a new icon.
const ICONS: Record<string, LucideIcon> = {
  Cpu,
  Radar,
  Cog,
  Sun,
  BatteryCharging,
  Wrench,
  CircuitBoard,
  Cable,
  Plug,
  Lightbulb,
  Zap,
  Gauge,
  Thermometer,
  Radio,
  Wifi,
  Speaker,
  Boxes,
};

export function CategoryIcon({
  name,
  className = "h-7 w-7",
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = (name && ICONS[name]) || Boxes;
  return <Icon className={className} />;
}
