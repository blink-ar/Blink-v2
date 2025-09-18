import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DaysOfWeek } from "../DaysOfWeek";

describe("DaysOfWeek", () => {
  it("renders nothing when no availability is provided", () => {
    const { container } = render(<DaysOfWeek />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when empty availability is provided", () => {
    const { container } = render(<DaysOfWeek availability="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders "Todos los días" for all-day availability', () => {
    render(<DaysOfWeek availability="todos los días" />);
    expect(screen.getByText("Todos los días")).toBeInTheDocument();
    expect(screen.getByText("📅 Disponible:")).toBeInTheDocument();
  });

  it("renders day indicators for weekend availability", () => {
    render(<DaysOfWeek availability="fines de semana" />);

    // Should show the availability label
    expect(screen.getByText("📅 Disponible:")).toBeInTheDocument();

    // Should render all day indicators
    expect(screen.getByLabelText("Lunes: no disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Martes: no disponible")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Miércoles: no disponible")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Jueves: no disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Viernes: no disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Sábado: disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Domingo: disponible")).toBeInTheDocument();
  });

  it("renders day indicators for weekday availability", () => {
    render(<DaysOfWeek availability="lunes a viernes" />);

    // Should show the availability label
    expect(screen.getByText("📅 Disponible:")).toBeInTheDocument();

    // Weekdays should be available
    expect(screen.getByLabelText("Lunes: disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Martes: disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Miércoles: disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Jueves: disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Viernes: disponible")).toBeInTheDocument();

    // Weekends should not be available
    expect(screen.getByLabelText("Sábado: no disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Domingo: no disponible")).toBeInTheDocument();
  });

  it("renders custom text for unparseable availability", () => {
    render(<DaysOfWeek availability="horario especial" />);

    expect(screen.getByText("📅 Disponible:")).toBeInTheDocument();
    expect(screen.getByText("horario especial")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <DaysOfWeek availability="todos los días" className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders day indicators for specific day availability", () => {
    render(<DaysOfWeek availability="lunes y miércoles" />);

    // Should show the availability label
    expect(screen.getByText("📅 Disponible:")).toBeInTheDocument();

    // Only Monday and Wednesday should be available
    expect(screen.getByLabelText("Lunes: disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Martes: no disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Miércoles: disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Jueves: no disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Viernes: no disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Sábado: no disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Domingo: no disponible")).toBeInTheDocument();
  });
});
