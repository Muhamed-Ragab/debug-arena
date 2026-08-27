import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { Providers } from "@/app/providers";

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <Providers>{children}</Providers>
    ),
    ...options,
  });
}

export * from "@testing-library/react";
