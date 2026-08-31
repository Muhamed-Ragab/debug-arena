"use client";

import * as React from "react";
import type { TooltipPayloadEntry, TooltipValueType } from "recharts";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { dark: ".dark", light: "" } as const;

const INITIAL_DIMENSION = { height: 200, width: 320 } as const;
type TooltipNameType = number | string;

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
>;

interface ChartContextProps {
  config: ChartConfig;
}

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
  initialDimension?: {
    width: number;
    height: number;
  };
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden",
          className
        )}
        data-chart={chartId}
        data-slot="chart"
        {...props}
      >
        <ChartStyle config={config} id={chartId} />
        <RechartsPrimitive.ResponsiveContainer
          initialDimension={initialDimension}
        >
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, entryConfig]) => entryConfig.theme ?? entryConfig.color
  );

  if (!colorConfig.length) {
    return null;
  }

  const css = Object.entries(THEMES)
    .map(
      ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ??
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`
    )
    .join("\n");

  return <style>{css}</style>;
};

const ChartTooltip = RechartsPrimitive.Tooltip;

type RechartsPayloadItem = TooltipPayloadEntry<
  TooltipValueType,
  TooltipNameType
>;

function getTooltipItemKey(
  item: RechartsPayloadItem,
  nameKey: string | undefined,
  index: number
): string {
  const base = String(nameKey ?? item.name ?? item.dataKey ?? "value");
  return `${base}-${index}`;
}

function getLegendItemKey(
  item: unknown,
  nameKey: string | undefined,
  index: number
): string {
  const dataKey =
    typeof item === "object" &&
    item !== null &&
    "dataKey" in item &&
    (item as Record<string, unknown>).dataKey !== undefined
      ? String((item as Record<string, unknown>).dataKey)
      : "value";
  const base = String(nameKey ?? dataKey);
  return `${base}-${index}`;
}

function formatRechartsValue(value: unknown): string {
  return typeof value === "number" ? value.toLocaleString() : String(value);
}

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined;
}

function TooltipIndicator({
  indicator,
  hideIndicator,
  indicatorColor,
  nestLabel,
  icon: Icon,
}: {
  indicator: "line" | "dot" | "dashed";
  hideIndicator: boolean;
  indicatorColor?: string;
  nestLabel: boolean;
  icon?: React.ComponentType;
}) {
  if (Icon) {
    return <Icon />;
  }
  if (hideIndicator) {
    return null;
  }
  return (
    <div
      className={cn(
        "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
        {
          "h-2.5 w-2.5": indicator === "dot",
          "my-0.5": nestLabel && indicator === "dashed",
          "w-0 border-[1.5px] border-dashed bg-transparent":
            indicator === "dashed",
          "w-1": indicator === "line",
        }
      )}
      style={
        {
          "--color-bg": indicatorColor,
          "--color-border": indicatorColor,
        } as React.CSSProperties
      }
    />
  );
}

function renderTooltipItem(
  item: RechartsPayloadItem,
  index: number,
  options: {
    config: ChartConfig;
    nameKey?: string;
    color?: string;
    indicator: "line" | "dot" | "dashed";
    hideIndicator: boolean;
    nestLabel: boolean;
    tooltipLabel: React.ReactNode;
    formatter?: (
      value: unknown,
      name: unknown,
      item: unknown,
      idx: number,
      payload: unknown
    ) => React.ReactNode;
  }
): React.ReactNode {
  const rawKey = `${options.nameKey ?? item.name ?? item.dataKey ?? "value"}`;
  const itemConfig = getPayloadConfigFromPayload(options.config, item, rawKey);
  const payloadFill =
    item.payload !== null &&
    typeof item.payload === "object" &&
    "fill" in (item.payload as Record<string, unknown>)
      ? ((item.payload as Record<string, unknown>).fill as string | undefined)
      : undefined;
  const indicatorColor = options.color ?? payloadFill ?? item.color;
  const stableKey = getTooltipItemKey(item, options.nameKey, index);

  const shouldUseFormatter =
    options.formatter !== undefined &&
    item.value !== undefined &&
    item.name !== undefined &&
    item.name !== null;

  if (shouldUseFormatter && options.formatter) {
    return (
      <div
        className={cn(
          "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
          options.indicator === "dot" && "items-center"
        )}
        key={stableKey}
      >
        {options.formatter(
          item.value,
          item.name as string | number,
          item as unknown,
          index,
          item.payload
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
        options.indicator === "dot" && "items-center"
      )}
      key={stableKey}
    >
      <TooltipIndicator
        hideIndicator={options.hideIndicator}
        icon={itemConfig?.icon}
        indicator={options.indicator}
        indicatorColor={indicatorColor}
        nestLabel={options.nestLabel}
      />
      <div
        className={cn(
          "flex flex-1 justify-between leading-none",
          options.nestLabel ? "items-end" : "items-center"
        )}
      >
        <div className="grid gap-1.5">
          {options.nestLabel ? options.tooltipLabel : null}
          <span className="text-muted-foreground">
            {itemConfig?.label ?? (item.name as React.ReactNode)}
          </span>
        </div>
        {hasValue(item.value) ? (
          <span className="font-medium font-mono text-foreground tabular-nums">
            {formatRechartsValue(item.value)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
  } & Omit<
    RechartsPrimitive.DefaultTooltipContentProps<
      TooltipValueType,
      TooltipNameType
    >,
    "accessibilityLayer"
  >) {
  const { config } = useChart();

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }

    const [item] = payload;
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value =
      !labelKey && typeof label === "string"
        ? (config[label]?.label ?? label)
        : itemConfig?.label;

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      );
    }

    if (!value) {
      return null;
    }

    return <div className={cn("font-medium", labelClassName)}>{value}</div>;
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ]);

  if (!(active && payload?.length)) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== "dot";

  return (
    <div
      className={cn(
        "grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
    >
      {nestLabel ? null : (tooltipLabel ?? null)}
      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== "none")
          .map((item, index) =>
            renderTooltipItem(item, index, {
              color,
              config,
              formatter: formatter as
                | ((
                    value: unknown,
                    name: unknown,
                    item: unknown,
                    idx: number,
                    payload: unknown
                  ) => React.ReactNode)
                | undefined,
              hideIndicator,
              indicator,
              nameKey,
              nestLabel,
              tooltipLabel,
            })
          )}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: React.ComponentProps<"div"> & {
  hideIcon?: boolean;
  nameKey?: string;
} & RechartsPrimitive.DefaultLegendContentProps) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
      {payload
        .filter((item) => item.type !== "none")
        .map((item, index) => {
          const key = `${nameKey ?? item.dataKey ?? "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          const stableKey = getLegendItemKey(item, nameKey, index);

          return (
            <div
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
              key={stableKey}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
    </div>
  );
}

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return;
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
};
