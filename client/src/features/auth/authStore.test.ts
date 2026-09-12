import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./authStore";
import type { User } from "../../types/auth";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it("should initialize with unauthenticated state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("should store access token in memory and set authenticated to true", () => {
    const mockUser: User = {
      id: "u-1",
      name: "Admin User",
      email: "admin@velozity.com",
      role: "ADMIN",
    };

    useAuthStore.getState().setAuth(mockUser, "mock.jwt.token");

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe("mock.jwt.token");
    expect(state.isAuthenticated).toBe(true);
    expect(state.isInitializing).toBe(false);
  });

  it("should clear auth on clearAuth", () => {
    const mockUser: User = {
      id: "u-2",
      name: "Dev User",
      email: "dev@velozity.com",
      role: "DEVELOPER",
    };

    useAuthStore.getState().setAuth(mockUser, "token-123");
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});

