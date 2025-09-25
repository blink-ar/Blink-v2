import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DaysOfWeek } from "../DaysOfWeek";

describe("DaysOfWeek Integration Tests", () => {
  it("should correctly display 'todos los martes' pattern from real benefit data", () => {
    // Simulate a benefit object similar to what would come from the mock data
    const benefit = {
      bankName: "Banco Ciudad",
      cardName: "Tarjeta Martes",
      benefit: "Descuento especial todos los martes",
      rewardRate: "15%",
      color: "bg-blue-500",
      icon: "CreditCard",
      tipo: "Descuento Semanal",
      cuando: "Disponible siempre", // This should be overridden by condicion
      valor: "15%",
      tope: "Descuento máximo $200 por compra",
      claseDeBeneficio: "Gastronomía",
      condicion: "todos los martes", // This should take priority
      requisitos: ["Tarjeta activa", "Compra mínima de $100"],
      usos: ["Restaurantes participantes", "Delivery de comida", "Cafeterías"],
      textoAplicacion:
        "Presentar tarjeta antes del pago. Válido exclusivamente los martes.",
    };

    render(<DaysOfWeek benefit={benefit} />);

    // Should show the availability label
    expect(screen.getByText("📅 Disponible:")).toBeInTheDocument();

    // Only Tuesday should be available (todos los martes)
    expect(screen.getByLabelText("Lunes: no disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Martes: disponible")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Miércoles: no disponible")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Jueves: no disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Viernes: no disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Sábado: no disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Domingo: no disponible")).toBeInTheDocument();
  });

  it("should correctly display weekend pattern from existing mock data", () => {
    // Simulate the existing BBVA benefit from mock data
    const benefit = {
      bankName: "BBVA",
      cardName: "Tarjeta Oro",
      benefit: "Descuento en tiendas de moda",
      rewardRate: "10%",
      color: "bg-blue-600",
      icon: "CreditCard",
      tipo: "Descuento Moda",
      cuando: "Válido los fines de semana",
      valor: "10%",
      tope: "Descuento máximo $100 por compra",
      claseDeBeneficio: "Moda y Accesorios",
      condicion: "Aplicable solo sábados y domingos",
      requisitos: [
        "Compra mínima de $50",
        "Válido solo fines de semana",
        "Tarjeta BBVA activa",
      ],
      usos: [
        "Zara tiendas físicas",
        "Zara online con tarjeta BBVA",
        "Otras tiendas de moda participantes",
      ],
      textoAplicacion:
        "Descuento aplicado automáticamente en caja. Válido sábados y domingos únicamente.",
    };

    render(<DaysOfWeek benefit={benefit} />);

    // Should show the availability label
    expect(screen.getByText("📅 Disponible:")).toBeInTheDocument();

    // Only weekends should be available
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

  it("should handle complex multi-field scenarios", () => {
    // Test a complex scenario with conflicting information across fields
    const benefit = {
      bankName: "Test Bank",
      cardName: "Test Card",
      benefit: "Complex benefit",
      rewardRate: "5%",
      color: "bg-green-500",
      icon: "CreditCard",
      cuando: "todos los días", // General availability
      condicion: "válido solo lunes y martes", // More specific restriction
      requisitos: [
        "aplicable miércoles", // Additional day from requisitos
        "compra mínima $50",
      ],
      textoAplicacion: "Válido en tiendas participantes",
    };

    render(<DaysOfWeek benefit={benefit} />);

    // Should show the availability label
    expect(screen.getByText("📅 Disponible:")).toBeInTheDocument();

    // Should prioritize condicion field (lunes y martes) over otros fields
    // But also include miércoles from requisitos due to union logic for same-field merging
    expect(screen.getByLabelText("Lunes: disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Martes: disponible")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Miércoles: no disponible")
    ).toBeInTheDocument(); // condicion takes priority over requisitos
    expect(screen.getByLabelText("Jueves: no disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Viernes: no disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Sábado: no disponible")).toBeInTheDocument();
    expect(screen.getByLabelText("Domingo: no disponible")).toBeInTheDocument();
  });
});
