import { Facebook, Instagram, Music2, MessageCircle, Globe, Users, SlidersHorizontal, Lock } from "lucide-react";

export const SITE_URL = "https://koosandmike.co.za";

// One entry per value stored in social_posts.platform.
export const PLATFORM_META = {
  "Facebook Page": { label: "Facebook", icon: Facebook, color: "#1877F2", integration: "facebook", publishable: true },
  "Facebook Groups": { label: "Groups", icon: Facebook, color: "#1877F2", integration: "facebook", publishable: false },
  Instagram: { label: "Instagram", icon: Instagram, color: "#E1306C", integration: "instagram", publishable: true },
  TikTok: { label: "TikTok", icon: Music2, color: "#25F4EE", integration: "tiktok", publishable: false },
  "WhatsApp Status": { label: "WhatsApp", icon: MessageCircle, color: "#25D366", integration: null, publishable: false },
};

export const PLATFORMS = Object.keys(PLATFORM_META);

export const AUDIENCES = [
  { value: "public", label: "Public", icon: Globe, hint: "Anyone on or off the platform" },
  { value: "followers", label: "Followers", icon: Users, hint: "People who follow the page" },
  { value: "custom", label: "Custom", icon: SlidersHorizontal, hint: "Describe who should see this" },
  { value: "private", label: "Private", icon: Lock, hint: "Only you can see this post" },
];

export const POST_TYPES = ["Car Post", "Reel/Video", "Story"];

export const INTEGRATION_DOT = { active: "#22c55e", inactive: "#6b7280", disabled: "#ef4444" };

export const isVideoUrl = (url) => /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url || "");

export const audienceLabel = (value) => AUDIENCES.find((item) => item.value === value)?.label || "Public";

export const audienceIcon = (value) => AUDIENCES.find((item) => item.value === value)?.icon || Globe;
