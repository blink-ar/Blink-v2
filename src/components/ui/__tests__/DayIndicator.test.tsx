import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DayIndicator } from "../DayIndicator";

describe("DayIndicator", () => {
  it("renders available day with correct styling", () => {
    render(
      <DayIndicator dayAbbreviation="L" dayName="Lunes" isAvailable={true} />
    );

    const indicator = screen.getByRole("status");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute("aria-label", "Lunes: disponible");
    expect(indicator).toHaveClass("bg-blue-500", "text-white");
    expect(screen.getByText("L")).toBeInTheDocument();
  });

  it("renders unavailable day with correct styling", () => {
    render(
      <DayIndicator dayAbbreviation="S" dayName="Sábado" isAvailable={false} />
    );

    const indicator = screen.getByRole("status");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute("aria-label", "Sábado: no disponible");
    expect(indicator).toHaveClass("bg-gray-100", "text-gray-400");
    expect(screen.getByText("S")).toBeInTheDocument();
  });

  it("applies custom className when provided", () => {
    render(
      <DayIndicator
        dayAbbreviation="V"
        dayName="Viernes"
        isAvailable={true}
        className="custom-class"
      />
    );

    const indicator = screen.getByRole("status");
    expect(indicator).toHaveClass("custom-class");
  });

  it("has proper accessibility attributes", () => {
    render(
      <DayIndicator dayAbbreviation="M" dayName="Martes" isAvailable={true} />
    );

    const indicator = screen.getByRole("status");
    expect(indicator).toHaveAttribute("aria-label", "Martes: disponible");
    expect(indicator).toHaveAttribute("title", "Martes: disponible");

    const abbreviation = screen.getByText("M");
    expect(abbreviation).toHaveAttribute("aria-hidden", "true");
  });
});
