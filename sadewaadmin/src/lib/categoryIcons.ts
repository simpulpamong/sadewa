import {
  Flame, Shield, ShieldAlert, Siren, Car, Truck, Building2, Users, AlertTriangle, FileText,
  ClipboardList, Map, MapPin, Camera, Megaphone, Wrench, HeartPulse, Waves, Wind, Zap,
  Home, Store, Trees, Bike, CircleDot, Flag, Landmark, HardHat, Bell, Package, Radio,
  Construction, Droplets, Trash2, PawPrint, BadgeAlert, LifeBuoy, Scale, Gavel, PhoneCall, Search,
  type LucideIcon,
} from 'lucide-react';

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Flame, Shield, ShieldAlert, Siren, Car, Truck, Building2, Users, AlertTriangle, FileText,
  ClipboardList, Map, MapPin, Camera, Megaphone, Wrench, HeartPulse, Waves, Wind, Zap,
  Home, Store, Trees, Bike, CircleDot, Flag, Landmark, HardHat, Bell, Package, Radio,
  Construction, Droplets, Trash2, PawPrint, BadgeAlert, LifeBuoy, Scale, Gavel, PhoneCall, Search,
};

export const CATEGORY_ICON_OPTIONS = Object.keys(CATEGORY_ICON_MAP);

export function resolveCategoryIcon(name?: string | null): LucideIcon | null {
  if (!name) return null;
  return CATEGORY_ICON_MAP[name] || null;
}
