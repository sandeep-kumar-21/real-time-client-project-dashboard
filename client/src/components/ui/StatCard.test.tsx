import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "./StatCard";
import { CheckSquare } from "lucide-react";

describe("StatCard Component", () => {
  it("renders label, value, and subtitle correctly", () => {
    render(
      <StatCard
        label="Total Tasks"
        value={42}
        subtitle="Sprint deliverables"
        icon={<CheckSquare data-testid="icon" />}
        variant="success"
      />
    );

    expect(screen.getByText("Total Tasks")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Sprint deliverables")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});

