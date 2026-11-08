'use client';
import {
  Flame, Shield, ShieldAlert, Siren, Car, Truck, Building2, Users, AlertTriangle, FileText,
  ClipboardList, Map, MapPin, Camera, Megaphone, Wrench, HeartPulse, Waves, Wind, Zap,
  Home, Store, Trees, Bike, CircleDot, Flag, Landmark, HardHat, Bell, Package, Radio,
  Construction, Droplets, Trash2, PawPrint, BadgeAlert, LifeBuoy, Scale, Gavel, PhoneCall, Search,
  FolderTree, type LucideIcon, type LucideProps,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  Flame, Shield, ShieldAlert, Siren, Car, Truck, Building2, Users, AlertTriangle, FileText,
  ClipboardList, Map, MapPin, Camera, Megaphone, Wrench, HeartPulse, Waves, Wind, Zap,
  Home, Store, Trees, Bike, CircleDot, Flag, Landmark, HardHat, Bell, Package, Radio,
  Construction, Droplets, Trash2, PawPrint, BadgeAlert, LifeBuoy, Scale, Gavel, PhoneCall, Search,
  FolderTree,
};

export function getCategoryLucideIcon(name?: string | null): LucideIcon | null {
  if (!name) return null;
  return MAP[name] || null;
}

export function CategoryLucideIcon({ name, fallback: Fallback = FolderTree, ...props }: { name?: string | null; fallback?: LucideIcon } & LucideProps) {
  const C = (name && MAP[name]) || Fallback;
  return <C aria-hidden="true" {...props} />;
}
