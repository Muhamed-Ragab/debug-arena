"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useExtracted } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { flattenValidationErrors } from "@/lib/safe-action/validation";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "../actions";
import type { CategoryDTO } from "../types";

interface CategoryManagementProps {
  categories: CategoryDTO[];
}

type FilterValue = "all" | "active" | "inactive";

interface FormState {
  color: string;
  description: string;
  icon: string;
  isActive: boolean;
  name: string;
  slug: string;
  sortOrder: string;
}

const EMPTY_FORM: FormState = {
  color: "",
  description: "",
  icon: "",
  isActive: true,
  name: "",
  slug: "",
  sortOrder: "0",
};

function toFormState(cat: CategoryDTO): FormState {
  return {
    color: cat.color ?? "",
    description: cat.description ?? "",
    icon: cat.icon ?? "",
    isActive: cat.isActive,
    name: cat.name,
    slug: cat.slug,
    sortOrder: String(cat.sortOrder),
  };
}

function validateNameFieldPure(name: string): string | undefined {
  if (!name || name.length < 2) {
    return "Name must be at least 2 characters";
  }
  if (name.length > 80) {
    return "Name must be at most 80 characters";
  }
  return undefined;
}

function validateSlugFieldPure(slug: string): string | undefined {
  if (!slug) {
    return undefined;
  }
  if (slug.length < 2 || slug.length > 50) {
    return "Slug must be 2-50 characters";
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return "Slug must contain only lowercase letters, numbers and hyphens";
  }
  return undefined;
}

function validateColorFieldPure(color: string): string | undefined {
  if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return "Invalid hex color (e.g. #3b82f6)";
  }
  return undefined;
}

function validateIconFieldPure(icon: string): string | undefined {
  if (icon && icon.length > 50) {
    return "Icon must be at most 50 characters";
  }
  return undefined;
}

function validateDescriptionFieldPure(description: string): string | undefined {
  if (description && description.length > 500) {
    return "Description must be at most 500 characters";
  }
  return undefined;
}

function validateSortOrderFieldPure(sortOrder: string): string | undefined {
  const order = Number(sortOrder);
  if (
    Number.isNaN(order) ||
    !Number.isInteger(order) ||
    order < 0 ||
    order > 1000
  ) {
    return "Sort order must be an integer 0-1000";
  }
  return undefined;
}

function buildCreatePayload(form: FormState): {
  color: string | null;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  name: string;
  slug?: string;
  sortOrder: number;
} {
  return {
    color: form.color || null,
    description: form.description || null,
    icon: form.icon || null,
    isActive: form.isActive,
    name: form.name,
    sortOrder: Number(form.sortOrder),
    ...(form.slug ? { slug: form.slug } : {}),
  };
}

function buildUpdatePayload(
  form: FormState,
  editing: CategoryDTO
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (form.name !== editing.name) {
    data.name = form.name;
  }
  if (form.slug !== editing.slug) {
    data.slug = form.slug;
  }
  if (form.description !== (editing.description ?? "")) {
    data.description = form.description || null;
  }
  if (form.icon !== (editing.icon ?? "")) {
    data.icon = form.icon || null;
  }
  if (form.color !== (editing.color ?? "")) {
    data.color = form.color || null;
  }
  if (Number(form.sortOrder) !== editing.sortOrder) {
    data.sortOrder = Number(form.sortOrder);
  }
  if (form.isActive !== editing.isActive) {
    data.isActive = form.isActive;
  }
  if (Object.keys(data).length === 0) {
    data.name = form.name;
  }
  return data;
}

function getFilteredCategories(
  categories: CategoryDTO[],
  filter: FilterValue
): CategoryDTO[] {
  if (filter === "active") {
    return categories.filter((c) => c.isActive);
  }
  if (filter === "inactive") {
    return categories.filter((c) => !c.isActive);
  }
  return categories;
}

function validateCategoryFormPure(form: FormState): Record<string, string> {
  const errs: Record<string, string> = {};
  const nameErr = validateNameFieldPure(form.name);
  if (nameErr) {
    errs.name = nameErr;
  }
  const slugErr = validateSlugFieldPure(form.slug);
  if (slugErr) {
    errs.slug = slugErr;
  }
  const colorErr = validateColorFieldPure(form.color);
  if (colorErr) {
    errs.color = colorErr;
  }
  const iconErr = validateIconFieldPure(form.icon);
  if (iconErr) {
    errs.icon = iconErr;
  }
  const descErr = validateDescriptionFieldPure(form.description);
  if (descErr) {
    errs.description = descErr;
  }
  const orderErr = validateSortOrderFieldPure(form.sortOrder);
  if (orderErr) {
    errs.sortOrder = orderErr;
  }
  return errs;
}

function CategoryTable({
  categories,
  filtered,
  onDelete,
  onEdit,
}: {
  categories: CategoryDTO[];
  filtered: CategoryDTO[];
  onDelete: (cat: CategoryDTO) => void;
  onEdit: (cat: CategoryDTO) => void;
}) {
  const t = useExtracted();
  return (
    <Card className="overflow-hidden bg-surface shadow-xs">
      <Table>
        <TableHeader className="bg-inset/50">
          <TableRow>
            <TableHead className="px-4 py-3">{t("Name")}</TableHead>
            <TableHead className="px-4 py-3">{t("Slug")}</TableHead>
            <TableHead className="px-4 py-3">{t("Icon")}</TableHead>
            <TableHead className="px-4 py-3">{t("Color")}</TableHead>
            <TableHead className="px-4 py-3">{t("Sort order")}</TableHead>
            <TableHead className="px-4 py-3">{t("Status")}</TableHead>
            <TableHead className="px-4 py-3 text-end">{t("Actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border">
          {filtered.length > 0 ? (
            filtered.map((cat) => (
              <TableRow
                className="transition-colors hover:bg-inset/40"
                key={cat.id}
              >
                <TableCell className="px-4 py-3.5 font-semibold text-heading text-sm">
                  {cat.name}
                </TableCell>
                <TableCell className="px-4 py-3.5 font-mono text-muted-foreground text-xs">
                  {cat.slug}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-muted-foreground text-sm">
                  {cat.icon ?? "-"}
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  {cat.color ? (
                    <span className="flex items-center gap-2">
                      <span
                        aria-label={`Color ${cat.color}`}
                        className="inline-block h-4 w-4 shrink-0 rounded-full border border-border"
                        role="img"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-mono text-muted-foreground text-xs">
                        {cat.color}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-sm">
                  {cat.sortOrder}
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  {cat.isActive ? (
                    <Badge variant="success">{t("Active")}</Badge>
                  ) : (
                    <Badge variant="secondary">{t("Inactive")}</Badge>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-end">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      aria-label={t("Edit {name}", { name: cat.name })}
                      className="h-8 w-8 p-0"
                      onClick={() => onEdit(cat)}
                      size="icon"
                      variant="ghost"
                    >
                      <Pencil size={15} />
                    </Button>
                    <Button
                      aria-label={t("Delete {name}", { name: cat.name })}
                      className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-500/10 hover:text-rose-400"
                      onClick={() => onDelete(cat)}
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                className="px-4 py-8 text-center text-muted-foreground"
                colSpan={7}
              >
                {categories.length === 0 ? (
                  <span className="flex flex-col items-center gap-3">
                    <span>{t("No categories yet — create one")}</span>
                    <span className="text-muted-foreground text-xs">
                      {t("No categories matching filter.")}
                    </span>
                  </span>
                ) : (
                  t("No categories matching filter.")
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

export function CategoryManagement({
  categories: initialCategories,
}: CategoryManagementProps) {
  const t = useExtracted();
  const [categories, setCategories] = useState<CategoryDTO[]>(
    [...initialCategories].sort((a, b) => a.sortOrder - b.sortOrder)
  );
  const [filter, setFilter] = useState<FilterValue>("all");
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryDTO | null>(null);
  const [deleting, setDeleting] = useState<CategoryDTO | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [createErrors, setCreateErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [editErrors, setEditErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = getFilteredCategories(categories, filter);

  function translateMessage(raw: string): string {
    switch (raw) {
      case "Name must be at least 2 characters":
        return t("Name must be at least 2 characters");
      case "Name must be at most 80 characters":
        return t("Name must be at most 80 characters");
      case "Slug must be 2-50 characters":
        return t("Slug must be 2-50 characters");
      case "Slug must contain only lowercase letters, numbers and hyphens":
        return t(
          "Slug must contain only lowercase letters, numbers and hyphens"
        );
      case "Invalid hex color (e.g. #3b82f6)":
        return t("Invalid hex color (e.g. #3b82f6)");
      case "Icon must be at most 50 characters":
        return t("Icon must be at most 50 characters");
      case "Description must be at most 500 characters":
        return t("Description must be at most 500 characters");
      case "Sort order must be an integer 0-1000":
        return t("Sort order must be an integer 0-1000");
      default:
        return raw;
    }
  }

  function getValidationErrors(form: FormState): Record<string, string> {
    const raw = validateCategoryFormPure(form);
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      out[key] = translateMessage(value);
    }
    return out;
  }

  function handleCreateSuccess(res: unknown): boolean {
    if (res && typeof res === "object" && "data" in res) {
      const { data } = res as {
        data?: { success?: boolean; category?: unknown };
      };
      if (data?.success && data.category) {
        const newCat = data.category as CategoryDTO;
        setCategories((prev) =>
          [...prev, newCat].sort((a, b) => a.sortOrder - b.sortOrder)
        );
        toast.success(t("Category created"));
        setCreateOpen(false);
        setCreateForm(EMPTY_FORM);
        return true;
      }
    }
    return false;
  }

  function handleCreateValidationError(res: unknown): boolean {
    if (res && typeof res === "object" && "validationErrors" in res) {
      const ve = (res as { validationErrors?: unknown }).validationErrors;
      if (ve) {
        const flat = flattenValidationErrors(ve);
        setCreateErrors(flat);
        toast.error(t("Validation failed"));
        return true;
      }
    }
    return false;
  }

  function handleCreateServerError(res: unknown): boolean {
    const { serverError } = res as { serverError?: string };
    if (serverError) {
      toast.error(serverError);
      if (
        serverError.toLowerCase().includes("already exists") ||
        serverError.includes("409")
      ) {
        setCreateErrors((prev) => ({ ...prev, slug: serverError }));
      }
      return true;
    }
    return false;
  }

  async function executeCreate(): Promise<void> {
    const payload = buildCreatePayload(createForm);
    const res = await createCategoryAction(payload);
    if (handleCreateSuccess(res)) {
      return;
    }
    if (handleCreateValidationError(res)) {
      return;
    }
    if (handleCreateServerError(res)) {
      return;
    }
    toast.error(t("Something went wrong"));
  }

  function handleCreate() {
    const errs = getValidationErrors(createForm);
    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs);
      return;
    }
    setCreateErrors({});
    startTransition(() => {
      executeCreate();
    });
  }

  function handleEditSuccess(res: unknown): boolean {
    if (res && typeof res === "object" && "data" in res) {
      const { data } = res as {
        data?: { success?: boolean; category?: unknown };
      };
      if (data?.success && data.category) {
        const updated = data.category as CategoryDTO;
        setCategories((prev) =>
          prev
            .map((c) => (c.id === updated.id ? updated : c))
            .sort((a, b) => a.sortOrder - b.sortOrder)
        );
        toast.success(t("Category updated"));
        setEditOpen(false);
        setEditing(null);
        return true;
      }
    }
    return false;
  }

  function handleEditValidationError(res: unknown): boolean {
    if (res && typeof res === "object" && "validationErrors" in res) {
      const ve = (res as { validationErrors?: unknown }).validationErrors;
      if (ve) {
        const flat = flattenValidationErrors(ve);
        setEditErrors(flat);
        toast.error(t("Validation failed"));
        return true;
      }
    }
    return false;
  }

  function handleEditServerError(res: unknown): boolean {
    const { serverError } = res as { serverError?: string };
    if (serverError) {
      toast.error(serverError);
      if (serverError.toLowerCase().includes("already exists")) {
        setEditErrors((prev) => ({ ...prev, slug: serverError }));
      }
      return true;
    }
    return false;
  }

  async function executeEdit(): Promise<void> {
    if (!editing) {
      return;
    }
    const data = buildUpdatePayload(editForm, editing);
    const res = await updateCategoryAction({
      data: data as unknown as {
        name?: string;
        slug?: string;
        description?: string | null;
        icon?: string | null;
        color?: string | null;
        sortOrder?: number;
        isActive?: boolean;
      },
      id: editing.id,
    });
    if (handleEditSuccess(res)) {
      return;
    }
    if (handleEditValidationError(res)) {
      return;
    }
    if (handleEditServerError(res)) {
      return;
    }
    toast.error(t("Something went wrong"));
  }

  function handleEdit() {
    if (!editing) {
      return;
    }
    const errs = getValidationErrors(editForm);
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }
    setEditErrors({});
    startTransition(() => {
      executeEdit();
    });
  }

  function handleDeleteSuccess(res: unknown): boolean {
    if (res && typeof res === "object" && "data" in res) {
      const { data } = res as { data?: { success?: boolean } };
      if (data?.success) {
        if (deleting) {
          setCategories((prev) => prev.filter((c) => c.id !== deleting.id));
        }
        toast.success(t("Category deleted"));
        setDeleteOpen(false);
        setDeleting(null);
        return true;
      }
    }
    return false;
  }

  function handleDeleteValidationError(res: unknown): boolean {
    if (res && typeof res === "object" && "validationErrors" in res) {
      const ve = (res as { validationErrors?: unknown }).validationErrors;
      if (ve) {
        const flat = flattenValidationErrors(ve);
        setDeleteError(flat._errors ?? flat.id ?? "Validation failed");
        toast.error(t("Validation failed"));
        return true;
      }
    }
    return false;
  }

  function handleDeleteServerError(res: unknown): boolean {
    const { serverError } = res as { serverError?: string };
    if (serverError) {
      if (
        serverError.includes("409") ||
        serverError.toLowerCase().includes("challenges use") ||
        serverError.toLowerCase().includes("cannot delete")
      ) {
        setDeleteError(serverError);
      }
      toast.error(serverError);
      return true;
    }
    return false;
  }

  async function executeDelete(): Promise<void> {
    if (!deleting) {
      return;
    }
    const res = await deleteCategoryAction({ id: deleting.id });
    if (handleDeleteSuccess(res)) {
      return;
    }
    if (handleDeleteValidationError(res)) {
      return;
    }
    if (handleDeleteServerError(res)) {
      return;
    }
    toast.error(t("Something went wrong"));
  }

  function handleDelete() {
    if (!deleting) {
      return;
    }
    setDeleteError(null);
    startTransition(() => {
      executeDelete();
    });
  }

  function openEdit(cat: CategoryDTO) {
    setEditing(cat);
    setEditForm(toFormState(cat));
    setEditErrors({});
    setEditOpen(true);
  }

  function openDelete(cat: CategoryDTO) {
    setDeleting(cat);
    setDeleteError(null);
    setDeleteOpen(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-2xl text-heading tracking-tight">
            {t("Categories")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("Manage challenge categories — sorted by sort order.")}
          </p>
        </div>
        <Button
          onClick={() => {
            setCreateForm(EMPTY_FORM);
            setCreateErrors({});
            setCreateOpen(true);
          }}
        >
          <Plus size={16} />
          {t("Create category")}
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-surface/70 p-4">
        <div className="flex items-center gap-3">
          <span className="font-medium text-muted-foreground text-xs">
            {t("Filter:")}
          </span>
          <Select
            onValueChange={(v) => setFilter(v as FilterValue)}
            value={filter}
          >
            <SelectTrigger
              aria-label={t("Filter by status")}
              className="h-9 min-w-36 rounded-lg border-border bg-inset px-3 text-foreground text-xs"
            >
              <SelectValue placeholder={t("All categories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All categories")}</SelectItem>
              <SelectItem value="active">{t("Active only")}</SelectItem>
              <SelectItem value="inactive">{t("Inactive only")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <CategoryTable
        categories={categories}
        filtered={filtered}
        onDelete={openDelete}
        onEdit={openEdit}
      />

      {/* Create Dialog */}
      <Dialog onOpenChange={setCreateOpen} open={createOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Create category")}</DialogTitle>
            <DialogDescription>
              {t("Add a new challenge category.")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-name">{t("Name")}</Label>
              <Input
                id="create-name"
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder={t("React Rendering")}
                value={createForm.name}
              />
              {Boolean(createErrors.name) && (
                <span className="text-destructive text-xs">
                  {createErrors.name}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-slug">
                {t("Slug (optional — auto-generated)")}
              </Label>
              <Input
                id="create-slug"
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, slug: e.target.value }))
                }
                placeholder={t("react-rendering")}
                value={createForm.slug}
              />
              {Boolean(createErrors.slug) && (
                <span className="text-destructive text-xs">
                  {createErrors.slug}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-description">{t("Description")}</Label>
              <Input
                id="create-description"
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder={t("Short description")}
                value={createForm.description}
              />
              {Boolean(createErrors.description) && (
                <span className="text-destructive text-xs">
                  {createErrors.description}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="create-icon">{t("Icon")}</Label>
                <Input
                  id="create-icon"
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, icon: e.target.value }))
                  }
                  placeholder={t("Layers")}
                  value={createForm.icon}
                />
                {Boolean(createErrors.icon) && (
                  <span className="text-destructive text-xs">
                    {createErrors.icon}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="create-color">{t("Color")}</Label>
                <Input
                  id="create-color"
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, color: e.target.value }))
                  }
                  placeholder={t("#3b82f6")}
                  value={createForm.color}
                />
                {Boolean(createErrors.color) && (
                  <span className="text-destructive text-xs">
                    {createErrors.color}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-sortOrder">{t("Sort order")}</Label>
              <Input
                id="create-sortOrder"
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, sortOrder: e.target.value }))
                }
                type="number"
                value={createForm.sortOrder}
              />
              {Boolean(createErrors.sortOrder) && (
                <span className="text-destructive text-xs">
                  {createErrors.sortOrder}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-inset/50 px-3 py-2.5">
              <Label className="cursor-pointer" htmlFor="create-isActive">
                {t("Active")}
              </Label>
              <Switch
                checked={createForm.isActive}
                id="create-isActive"
                onCheckedChange={(v) =>
                  setCreateForm((p) => ({ ...p, isActive: v }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreateOpen(false)} variant="outline">
              {t("Cancel")}
            </Button>
            <Button disabled={isPending} onClick={handleCreate}>
              {isPending ? t("Creating...") : t("Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog onOpenChange={setEditOpen} open={editOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Edit category")}</DialogTitle>
            <DialogDescription>
              {t("Update category details.")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">{t("Name")}</Label>
              <Input
                id="edit-name"
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
                value={editForm.name}
              />
              {Boolean(editErrors.name) && (
                <span className="text-destructive text-xs">
                  {editErrors.name}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-slug">{t("Slug")}</Label>
              <Input
                id="edit-slug"
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, slug: e.target.value }))
                }
                value={editForm.slug}
              />
              {Boolean(editErrors.slug) && (
                <span className="text-destructive text-xs">
                  {editErrors.slug}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-description">{t("Description")}</Label>
              <Input
                id="edit-description"
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, description: e.target.value }))
                }
                value={editForm.description}
              />
              {Boolean(editErrors.description) && (
                <span className="text-destructive text-xs">
                  {editErrors.description}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-icon">{t("Icon")}</Label>
                <Input
                  id="edit-icon"
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, icon: e.target.value }))
                  }
                  value={editForm.icon}
                />
                {Boolean(editErrors.icon) && (
                  <span className="text-destructive text-xs">
                    {editErrors.icon}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-color">{t("Color")}</Label>
                <Input
                  id="edit-color"
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, color: e.target.value }))
                  }
                  value={editForm.color}
                />
                {Boolean(editErrors.color) && (
                  <span className="text-destructive text-xs">
                    {editErrors.color}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-sortOrder">{t("Sort order")}</Label>
              <Input
                id="edit-sortOrder"
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, sortOrder: e.target.value }))
                }
                type="number"
                value={editForm.sortOrder}
              />
              {Boolean(editErrors.sortOrder) && (
                <span className="text-destructive text-xs">
                  {editErrors.sortOrder}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-inset/50 px-3 py-2.5">
              <Label className="cursor-pointer" htmlFor="edit-isActive">
                {t("Active")}
              </Label>
              <Switch
                checked={editForm.isActive}
                id="edit-isActive"
                onCheckedChange={(v) =>
                  setEditForm((p) => ({ ...p, isActive: v }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setEditOpen(false)} variant="outline">
              {t("Cancel")}
            </Button>
            <Button disabled={isPending} onClick={handleEdit}>
              {isPending ? t("Saving...") : t("Save changes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Delete category")}</DialogTitle>
            <DialogDescription>
              {deleting
                ? t(
                    'Are you sure you want to delete "{name}"? This cannot be undone.',
                    {
                      name: deleting.name,
                    }
                  )
                : t("Are you sure?")}
            </DialogDescription>
          </DialogHeader>
          {Boolean(deleteError) && (
            <Alert variant="destructive">
              <AlertDescription>
                {deleteError ? deleteError : null}
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button onClick={() => setDeleteOpen(false)} variant="outline">
              {t("Cancel")}
            </Button>
            <Button
              disabled={isPending}
              onClick={handleDelete}
              variant="destructive"
            >
              {isPending ? t("Deleting...") : t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
