import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: Date | string) => {
  if (!date) return "";
  return format(new Date(date), "PPP");
};

export const formatDateTime = (date: Date | string) => {
  if (!date) return "";
  return format(new Date(date), "PPp");
};

export const formatShortDate = (date: Date | string) => {
  if (!date) return "";
  return format(new Date(date), "P");
};

export const experienceBandToLabel = (band: string): string => {
  switch (band) {
    case "0-2":
      return "0-2 years";
    case "2-5.5":
      return "2-5.5 years";
    case "5.5-7":
      return "5.5-7 years";
    case "7-10":
      return "7-10 years";
    case "10+":
      return "10+ years";
    default:
      return band;
  }
};

export const ratingToLabel = (rating: string): string => {
  return rating[0].toUpperCase() + rating.slice(1).toLowerCase();
};

export const getRatingColor = (rating: string): string => {
  switch (rating.toLowerCase()) {
    case "beginner":
      return "bg-blue-100 text-blue-700";
    case "intermediate":
      return "bg-green-100 text-green-700";
    case "expert":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case "high":
      return "bg-red-50 text-red-700 border-red-100";
    case "medium":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "low":
      return "bg-gray-50 text-gray-700 border-gray-100";
    default:
      return "bg-gray-50 text-gray-700 border-gray-100";
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export const calculateTimeLeft = (endDate: Date | string): string => {
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();
  const distance = end - now;

  if (distance < 0) {
    return "Ended";
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  if (days > 30) {
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? "s" : ""}`;
  }
  return `${days} day${days !== 1 ? "s" : ""}`;
};

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "prospect":
      return "bg-blue-100 text-blue-700";
    case "negotiation":
      return "bg-amber-100 text-amber-700";
    case "won":
      return "bg-green-100 text-green-700";
    case "lost":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export const getTrendIcon = (trend: number) => {
  if (trend > 0) return "arrow_upward";
  if (trend < 0) return "arrow_downward";
  return "remove";
};

export const getTrendColor = (trend: number, inverse: boolean = false) => {
  if (trend === 0) return "text-gray-500";
  if (inverse) {
    return trend > 0 ? "text-red-500" : "text-green-500";
  }
  return trend > 0 ? "text-green-500" : "text-red-500";
};
