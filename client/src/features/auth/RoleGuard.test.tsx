import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RoleGuard } from "./RoleGuard";
import { useAuthStore } from "./authStore";

describe("RoleGuard Component", () => {
  it("renders children when user role is allowed", () => {
    useAuthStore.getState().setAuth(
      {
        id: "pm-1",
        name: "Neha PM",
        email: "neha@velozity.com",
        role: "PROJECT_MANAGER",
      },
      "token"
    );

    render(
      <MemoryRouter>
        <RoleGuard allowedRoles={["ADMIN", "PROJECT_MANAGER"]}>
          <div data-testid="protected-content">PM Protected Content</div>
        </RoleGuard>
      </MemoryRouter>
    );

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    expect(screen.queryByText("Access Restricted")).not.toBeInTheDocument();
  });

  it("renders Access Restricted when user role is not permitted", () => {
    useAuthStore.getState().setAuth(
      {
        id: "dev-1",
        name: "Ravi Dev",
        email: "ravi@velozity.com",
        role: "DEVELOPER",
      },
      "token"
    );

    render(
      <MemoryRouter>
        <RoleGuard allowedRoles={["ADMIN", "PROJECT_MANAGER"]}>
          <div data-testid="protected-content">Restricted Area</div>
        </RoleGuard>
      </MemoryRouter>
    );

    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(screen.getByText(/DEVELOPER/)).toBeInTheDocument();
  });
});

