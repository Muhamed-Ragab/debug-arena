"use client";

import { Check, ChevronDown } from "lucide-react";
import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SelectContextType {
  disabled?: boolean;
  isOpen: boolean;
  onSelect: (value: string) => void;
  open: boolean;
  selectedValue: string;
  setIsOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | null>(null);

export interface SelectOption {
  disabled?: boolean;
  icon?: React.ReactNode;
  indicatorColor?: string;
  label: string;
  value: string;
}

export interface SelectProps {
  children?: React.ReactNode;
  defaultValue?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  value?: string;
}

export function Select({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  disabled = false,
  children,
}: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

  const isControlled = controlledValue !== undefined;
  const selectedValue = isControlled ? controlledValue : uncontrolledValue;

  const handleSelect = (val: string) => {
    if (!isControlled) {
      setUncontrolledValue(val);
    }
    onValueChange?.(val);
    setIsOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        disabled,
        isOpen,
        onSelect: handleSelect,
        open: isOpen,
        selectedValue,
        setIsOpen,
      }}
    >
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export function SelectTrigger({
  className,
  children,
  ...props
}: SelectTriggerProps) {
  const ctx = useContext(SelectContext);
  if (!ctx) {
    throw new Error("SelectTrigger must be used within a Select");
  }

  return (
    <button
      aria-expanded={ctx.isOpen}
      aria-haspopup="listbox"
      className={cn(
        "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-foreground text-sm shadow-xs transition-colors hover:border-border/80 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      disabled={ctx.disabled}
      onClick={() => ctx.setIsOpen(!ctx.isOpen)}
      type="button"
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
          ctx.isOpen && "rotate-180 text-foreground"
        )}
      />
    </button>
  );
}

export function SelectValue({
  placeholder = "Select an option",
  className,
}: {
  className?: string;
  placeholder?: string;
}) {
  const ctx = useContext(SelectContext);
  return (
    <span className={cn("truncate text-start", className)}>
      {ctx?.selectedValue ? undefined : (
        <span className="text-muted-foreground">{placeholder}</span>
      )}
    </span>
  );
}

export interface SelectContentProps {
  align?: "start" | "end" | "center";
  children: React.ReactNode;
  className?: string;
}

export function SelectContent({
  children,
  className,
  align = "start",
}: SelectContentProps) {
  const ctx = useContext(SelectContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ctx?.isOpen) {
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node) === false) {
        ctx.setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        ctx.setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [ctx]);

  if (!ctx?.isOpen) {
    return null;
  }

  const alignmentClasses = {
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
    start: "left-0",
  }[align];

  return (
    <div
      className={cn(
        "fade-in-80 slide-in-from-top-2 absolute top-full z-50 mt-1.5 max-h-64 w-full min-w-[8rem] animate-in overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg backdrop-blur-md",
        alignmentClasses,
        className
      )}
      ref={ref}
      role="listbox"
    >
      {children}
    </div>
  );
}

export interface SelectItemProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  value: string;
}

export function SelectItem({
  value,
  disabled = false,
  children,
  className,
}: SelectItemProps) {
  const ctx = useContext(SelectContext);
  const isSelected = ctx?.selectedValue === value;

  return (
    <div
      aria-selected={isSelected}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-md px-2.5 py-1.5 text-sm outline-none transition-colors hover:bg-inset hover:text-foreground",
        isSelected && "bg-primary/10 font-medium text-primary",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={() => {
        if (!disabled) {
          ctx?.onSelect(value);
        }
      }}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          ctx?.onSelect(value);
        }
      }}
      role="option"
      tabIndex={disabled ? -1 : 0}
    >
      <span className="flex-1 truncate">{children}</span>
      {isSelected ? (
        <Check className="ms-2 h-4 w-4 shrink-0 text-primary" />
      ) : null}
    </div>
  );
}

/**
 * Convenient Dropdown Selector component
 */
export function SimpleSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  label,
  className,
}: {
  className?: string;
  label?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  value: string;
}) {
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          {label}
        </span>
      ) : null}
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger className="h-9 min-w-[140px] border-border bg-card hover:border-border/80">
          <div className="flex items-center gap-2 truncate">
            {selectedOption?.indicatorColor ? (
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: selectedOption.indicatorColor }}
              />
            ) : null}
            {selectedOption?.icon ? (
              <span className="shrink-0">{selectedOption.icon}</span>
            ) : null}
            <span className="truncate">
              {selectedOption?.label ?? placeholder}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex items-center gap-2">
                {opt.indicatorColor ? (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: opt.indicatorColor }}
                  />
                ) : null}
                {opt.icon ? <span className="shrink-0">{opt.icon}</span> : null}
                <span>{opt.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
