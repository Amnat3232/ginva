import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn(),
          then: vi.fn(
            (cb: (arg: { data: unknown; error: unknown }) => void) => {
              cb({ data: null, error: null });
            }
          ),
        }),
        then: vi.fn((cb: (arg: { data: unknown; error: unknown }) => void) => {
          cb({ data: [], error: null });
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue({
            then: vi.fn(
              (cb: (arg: { data: unknown; error: unknown }) => void) => {
                cb({ data: null, error: null });
              }
            ),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          then: vi.fn(
            (cb: (arg: { data: unknown; error: unknown }) => void) => {
              cb({ data: null, error: null });
            }
          ),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          then: vi.fn(
            (cb: (arg: { data: unknown; error: unknown }) => void) => {
              cb({ data: null, error: null });
            }
          ),
        }),
      }),
    }),
  },
}));
