import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { SearchBar } from "../SearchBar";

describe("SearchBar", () => {
  const mockOnChange = vi.fn();
  const mockOnFilterClick = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnFilterClick.mockClear();
  });

  it("renders with default placeholder", () => {
    render(<SearchBar value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText("Buscar descuentos, tiendas...");
    expect(input).toBeInTheDocument();
  });

  it("renders with custom placeholder", () => {
    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        placeholder="Custom placeholder"
      />
    );

    const input = screen.getByPlaceholderText("Custom placeholder");
    expect(input).toBeInTheDocument();
  });

  it("displays the current value", () => {
    render(<SearchBar value="test search" onChange={mockOnChange} />);

    const input = screen.getByDisplayValue("test search");
    expect(input).toBeInTheDocument();
  });

  it("calls onChange when input value changes", () => {
    render(<SearchBar value="" onChange={mockOnChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "new search" } });

    expect(mockOnChange).toHaveBeenCalledWith("new search");
  });

  it("renders filter button when showFilter is true", () => {
    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        onFilterClick={mockOnFilterClick}
        showFilter={true}
      />
    );

    const filterButton = screen.getByLabelText("Filtrar resultados");
    expect(filterButton).toBeInTheDocument();
  });

  it("does not render filter button when showFilter is false", () => {
    render(<SearchBar value="" onChange={mockOnChange} showFilter={false} />);

    const filterButton = screen.queryByLabelText("Filtrar resultados");
    expect(filterButton).not.toBeInTheDocument();
  });

  it("calls onFilterClick when filter button is clicked", () => {
    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        onFilterClick={mockOnFilterClick}
      />
    );

    const filterButton = screen.getByLabelText("Filtrar resultados");
    fireEvent.click(filterButton);

    expect(mockOnFilterClick).toHaveBeenCalledTimes(1);
  });

  it("has proper accessibility attributes", () => {
    render(<SearchBar value="" onChange={mockOnChange} />);

    const input = screen.getByLabelText("Buscar descuentos y tiendas");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "text");
  });

  it("applies modern styling classes", () => {
    render(<SearchBar value="" onChange={mockOnChange} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("modern-search-input");
  });
});
