export type IconName =
  | "grid"
  | "book"
  | "calendar"
  | "check"
  | "chart"
  | "settings";

export type NavItem = {
  label: string;
  icon: IconName;
  active?: boolean;
};

export type Course = {
  code: string;
  title: string;
  progress: number;
  color: string;
  next: string;
  nextLabel: string;
};

export type ScheduleItem = {
  time: string;
  title: string;
  course: string;
  type: string;
  color: string;
};