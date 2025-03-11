import "@testing-library/jest-dom";
import { vi } from "vitest";

// Simula localStorage para testes
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: function (key: string) {
    return this.store[key] || null;
  },
  setItem: function (key: string, value: string) {
    this.store[key] = value.toString();
  },
  removeItem: function (key: string) {
    delete this.store[key];
  },
  clear: function () {
    this.store = {};
  },
};

// Configura mocks globais
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
});

// Mocks para hooks do React
vi.mock("react", async () => {
  const actualReact = await vi.importActual("react");
  return {
    ...actualReact,
    useState: vi.fn((initialState) => {
      let state =
        typeof initialState === "function" ? initialState() : initialState;

      const setState = vi.fn((newState) => {
        state = typeof newState === "function" ? newState(state) : newState;
        return state;
      });

      return [state, setState];
    }),
    useRef: vi.fn((initialValue) => ({
      current: initialValue,
    })),
    useEffect: vi.fn((effect) => {
      const cleanup = effect();
      if (typeof cleanup === "function") {
        cleanup();
      }
    }),
    useCallback: vi.fn((callback) => callback),
  };
});

// Configura timers globais
vi.mock("timers", () => ({
  setTimeout: vi.fn(),
  setInterval: vi.fn(),
  clearTimeout: vi.fn(),
  clearInterval: vi.fn(),
}));

// Adiciona métodos globais para testes
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};
