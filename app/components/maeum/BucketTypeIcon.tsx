"use client";

import { Droplets, Circle, ListTodo, LayoutGrid, LucideIcon } from "lucide-react";
import { BucketType } from "./types";

const ICONS: Record<BucketType, LucideIcon> = {
  hydrate: Droplets,
  mood: Circle,
  order: ListTodo,
  habit: LayoutGrid,
};

export default function BucketTypeIcon({
  type,
  size = 20,
  color,
  className = "",
}: {
  type: BucketType;
  size?: number;
  color?: string;
  className?: string;
}) {
  const Icon = ICONS[type];
  return <Icon size={size} color={color} strokeWidth={2} className={className} />;
}
