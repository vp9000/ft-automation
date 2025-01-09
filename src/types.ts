export type FastVisibility = "public" | "friends" | "you";

export type ScheduledFast = {
  id: string;
  creatorId: string;
  label: string;
  duration: number;
  isActive: boolean;
  participants: string[];
  visibility: FastVisibility;
  created: number;
  joinDeadline: number;
};

export type Friend = {
  activeFastId: string;
  friendsSince: number;
  id: string;
  name: string;
  status: "friends" | "request_sent" | "request_received";
};
