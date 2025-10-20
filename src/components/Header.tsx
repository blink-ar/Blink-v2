import React from "react";
import { Bell, User } from "lucide-react";
import { Link } from "react-router-dom";

interface HeaderProps {
  title?: string;
  showNotification?: boolean;
  showProfile?: boolean;
  notificationCount?: number;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = "Benefit",
  showNotification = true,
  showProfile = true,
  notificationCount = 0,
  onNotificationClick,
  onProfileClick,
}) => {
  return (
    <div className="modern-header header safe-area-top header-slide-down">
      {/* Main Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-white border-b border-gray-200">
        {/* Left: App Title */}
        <div className="flex items-center">
          <Link
            to="/"
            className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 hover:text-primary-600 transition-colors touch-target"
            style={{
              fontFamily: "var(--font-primary)",
              fontWeight: "var(--font-bold)",
              color: "var(--color-gray-900)",
            }}
          >
            {title}
          </Link>
        </div>

        {/* Right: Notification and Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification Icon */}
          {showNotification && (
            <button
              onClick={onNotificationClick}
              className="relative touch-target touch-button p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              style={{
                minWidth: "var(--touch-target-min)",
                minHeight: "var(--touch-target-min)",
                borderRadius: "var(--radius-full)",
              }}
              aria-label={`Notifications${
                notificationCount > 0 ? ` (${notificationCount})` : ""
              }`}
            >
              <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
              {notificationCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium rounded-full min-w-[18px] sm:min-w-[20px] h-4 sm:h-5 flex items-center justify-center px-1"
                  style={{
                    backgroundColor: "var(--color-error)",
                    color: "var(--color-white)",
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--font-medium)",
                    borderRadius: "var(--radius-full)",
                  }}
                >
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>
          )}

          {/* Profile Picture */}
          {showProfile && (
            <button
              onClick={onProfileClick}
              className="touch-target touch-button p-1 text-gray-600 hover:text-gray-900 rounded-full transition-colors"
              style={{
                minWidth: "var(--touch-target-min)",
                minHeight: "var(--touch-target-min)",
              }}
              aria-label="Profile"
            >
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center"
                style={{
                  background: "var(--gradient-primary)",
                  borderRadius: "var(--radius-full)",
                }}
              >
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
