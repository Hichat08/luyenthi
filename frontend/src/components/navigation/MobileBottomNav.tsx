import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type MobileBottomNavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  badgeCount?: number;
  onClick: () => void;
};

type MobileBottomNavProps = {
  items: MobileBottomNavItem[];
};

const MobileBottomNav = ({ items }: MobileBottomNavProps) => {
  return (
    <nav className="study-dashboard-bottom-nav md:hidden">
      {items.map(({ active, badgeCount = 0, icon: Icon, key, label, onClick }) => (
        <button
          key={key}
          type="button"
          className={cn(
            "study-dashboard-nav-button",
            active && "study-dashboard-nav-button-active"
          )}
          onClick={onClick}
        >
          <span className="study-dashboard-nav-icon-wrap">
            {badgeCount > 0 ? (
              <span className="study-dashboard-nav-badge">
                <span className="study-dashboard-nav-badge-label">
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              </span>
            ) : null}
            <Icon className="study-dashboard-nav-icon" />
          </span>
          <span className="study-dashboard-nav-text">{label}</span>
        </button>
      ))}
    </nav>
  );
};

export default MobileBottomNav;
