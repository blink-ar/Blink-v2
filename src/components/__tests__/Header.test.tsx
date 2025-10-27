import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import { Header } from "../Header";

// Wrapper component for router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe("Header Component", () => {
  it("renders with default props", () => {
    render(
      <RouterWrapper>
        <Header />
      </RouterWrapper>
    );

    // Check if the default title "Benefit" is rendered
    expect(screen.getByText("Benefit")).toBeInTheDocument();

    // Check if notification button is rendered
    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();

    // Check if profile button is rendered
    expect(screen.getByLabelText("Profile")).toBeInTheDocument();
  });

  it("renders with custom title", () => {
    render(
      <RouterWrapper>
        <Header title="Custom Title" />
      </RouterWrapper>
    );

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
  });

  it("shows notification badge when count is provided", () => {
    render(
      <RouterWrapper>
        <Header notificationCount={5} />
      </RouterWrapper>
    );

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByLabelText("Notifications (5)")).toBeInTheDocument();
  });

  it("shows 99+ for notification counts over 99", () => {
    render(
      <RouterWrapper>
        <Header notificationCount={150} />
      </RouterWrapper>
    );

    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("calls notification click handler", () => {
    const mockNotificationClick = vi.fn();

    render(
      <RouterWrapper>
        <Header onNotificationClick={mockNotificationClick} />
      </RouterWrapper>
    );

    fireEvent.click(screen.getByLabelText("Notifications"));
    expect(mockNotificationClick).toHaveBeenCalledTimes(1);
  });

  it("calls profile click handler", () => {
    const mockProfileClick = vi.fn();

    render(
      <RouterWrapper>
        <Header onProfileClick={mockProfileClick} />
      </RouterWrapper>
    );

    fireEvent.click(screen.getByLabelText("Profile"));
    expect(mockProfileClick).toHaveBeenCalledTimes(1);
  });

  it("hides notification when showNotification is false", () => {
    render(
      <RouterWrapper>
        <Header showNotification={false} />
      </RouterWrapper>
    );

    expect(screen.queryByLabelText(/Notifications/)).not.toBeInTheDocument();
  });

  it("hides profile when showProfile is false", () => {
    render(
      <RouterWrapper>
        <Header showProfile={false} />
      </RouterWrapper>
    );

    expect(screen.queryByLabelText("Profile")).not.toBeInTheDocument();
  });
});
