import { render, screen, fireEvent } from "@testing-library/react";
import type React from "react";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "../Header";

const pushNotificationMocks = vi.hoisted(() => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  state: {
    isSupported: true,
    permission: "default" as NotificationPermission,
    isSubscribed: false,
    isLoading: false,
  },
}));

vi.mock("../../hooks/usePushNotifications", () => ({
  usePushNotifications: () => ({
    ...pushNotificationMocks.state,
    subscribe: pushNotificationMocks.subscribe,
    unsubscribe: pushNotificationMocks.unsubscribe,
  }),
}));

const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

const renderHeader = (props: React.ComponentProps<typeof Header> = {}) =>
  render(
    <RouterWrapper>
      <Header {...props} />
    </RouterWrapper>
  );

describe("Header Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pushNotificationMocks.state.isSupported = true;
    pushNotificationMocks.state.permission = "default";
    pushNotificationMocks.state.isSubscribed = false;
    pushNotificationMocks.state.isLoading = false;
  });

  it("renders the Blink title by default", () => {
    renderHeader();

    expect(screen.getByRole("link", { name: "Blink" })).toHaveAttribute("href", "/");
  });

  it("renders with custom title", () => {
    renderHeader({ title: "Custom Title" });

    expect(screen.getByRole("link", { name: "Custom Title" })).toBeInTheDocument();
  });

  it("prompts users to activate push notifications when unsubscribed", () => {
    renderHeader();

    const button = screen.getByRole("button", { name: "Activar notificaciones" });
    fireEvent.click(button);

    expect(pushNotificationMocks.subscribe).toHaveBeenCalledTimes(1);
    expect(pushNotificationMocks.unsubscribe).not.toHaveBeenCalled();
  });

  it("lets subscribed users deactivate push notifications", () => {
    pushNotificationMocks.state.permission = "granted";
    pushNotificationMocks.state.isSubscribed = true;

    renderHeader();

    const button = screen.getByRole("button", { name: "Desactivar notificaciones" });
    fireEvent.click(button);

    expect(pushNotificationMocks.unsubscribe).toHaveBeenCalledTimes(1);
    expect(pushNotificationMocks.subscribe).not.toHaveBeenCalled();
  });

  it("hides the notification control when push is unsupported or denied", () => {
    pushNotificationMocks.state.isSupported = false;
    const { rerender } = renderHeader();

    expect(screen.queryByRole("button", { name: /notificaciones/i })).not.toBeInTheDocument();

    pushNotificationMocks.state.isSupported = true;
    pushNotificationMocks.state.permission = "denied";
    rerender(
      <RouterWrapper>
        <Header />
      </RouterWrapper>
    );

    expect(screen.queryByRole("button", { name: /notificaciones/i })).not.toBeInTheDocument();
  });

  it("disables the notification control while push state is loading", () => {
    pushNotificationMocks.state.isLoading = true;

    renderHeader();

    expect(screen.getByRole("button", { name: "Activar notificaciones" })).toBeDisabled();
  });
});
