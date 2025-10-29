import { vi } from "vitest";

export const createMockDatabase = () => ({
  prepare: vi.fn(() => ({
    run: vi.fn(),
    get: vi.fn(),
    all: vi.fn(),
  })),
  exec: vi.fn(),
  close: vi.fn(),
});

export const createMockIpcRenderer = () => ({
  invoke: vi.fn(),
  on: vi.fn(),
  send: vi.fn(),
  removeListener: vi.fn(),
});

export const createMockSupabaseClient = () => ({
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(),
      single: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    })),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
});
