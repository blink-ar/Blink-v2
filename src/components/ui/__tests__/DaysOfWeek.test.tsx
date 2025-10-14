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

  describe("Multi-field parsing with benefit object", () => {
    it("should use multi-field parsing when benefit object is provided", () => {
      const benefit = {
        bankName: "Test Bank",
        cardName: "Test Card",
        benefit: "Test Benefit",
        rewardRate: "10%",
        color: "#000000",
        icon: "test-icon",
        condicion: "válido solo fines de semana",
        cuando: "todos los días", // This should be overridden by condicion
        requisitos: ["tarjeta activa"],
        textoAplicacion: "presentar en caja",
      };

      render(<DaysOfWeek benefit={benefit} />);

      // Should show the availability label
      expect(screen.getByText("📅 Disponible:")).toBeInTheDocument();

      // Should prioritize condicion field (weekends only) over cuando field (all days)
      expect(screen.getByLabelText("Lunes: no disponible")).toBeInTheDocument();
      expect(
        screen.getByLabelText("Martes: no disponible")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Miércoles: no disponible")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Jueves: no disponible")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Viernes: no disponible")
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Sábado: disponible")).toBeInTheDocument();
      expect(screen.getByLabelText("Domingo: disponible")).toBeInTheDocument();
    });

    it("should handle 'todos los martes' pattern from benefit object", () => {
      const benefit = {
        bankName: "Test Bank",
        cardName: "Test Card",
        benefit: "Test Benefit",
        rewardRate: "10%",
        color: "#000000",
        icon: "test-icon",
        condicion: "todos los martes",
      };

      render(<DaysOfWeek benefit={benefit} />);

      // Should show the availability label
      expect(screen.getByText("📅 Disponible:")).toBeInTheDocument();

      // Only Tuesday should be available
      expect(screen.getByLabelText("Lunes: no disponible")).toBeInTheDocument();
      expect(screen.getByLabelText("Martes: disponible")).toBeInTheDocument();
      expect(
        screen.getByLabelText("Miércoles: no disponible")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Jueves: no disponible")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Viernes: no disponible")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Sábado: no disponible")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Domingo: no disponible")
      ).toBeInTheDocument();
    });

    it("should merge multiple requisitos with day information", () => {
      const benefit = {
        bankName: "Test Bank",
        cardName: "Test Card",
        benefit: "Test Benefit",
        rewardRate: "10%",
        color: "#000000",
        icon: "test-icon",
        requisitos: [
          "válido lunes y martes",
          "aplicable miércoles",
          "compra mínima $100",
        ],
      };

      render(<DaysOfWeek benefit={benefit} />);

      // Should show the availability label
      expect(screen.getByText("📅 Disponible:")).toBeInTheDocument();

      // Monday, Tuesday, and Wednesday should be available
      expect(screen.getByLabelText("Lunes: disponible")).toBeInTheDocument();
      expect(screen.getByLabelText("Martes: disponible")).toBeInTheDocument();
      expect(
        screen.getByLabelText("Miércoles: disponible")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Jueves: no disponible")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Viernes: no disponible")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Sábado: no disponible")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Domingo: no disponible")
      ).toBeInTheDocument();
    });

    it("should maintain backward compatibility with availability prop", () => {
      const benefit = {
        bankName: "Test Bank",
        cardName: "Test Card",
        benefit: "Test Benefit",
        rewardRate: "10%",
        color: "#000000",
        icon: "test-icon",
      };

      render(<DaysOfWeek benefit={benefit} availability="lunes a viernes" />);

      // Should use multi-field parsing (benefit object) and ignore availability prop
      // Since benefit has no day info, should return null and render nothing
      const container = document.querySelector(".flex.items-center.gap-3");
      expect(container).not.toBeInTheDocument();
    });
  });
});
