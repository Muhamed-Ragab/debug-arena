"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
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

export function CategoryManagement({
  categories: initialCategories,
}: CategoryManagementProps) {
  const t = useTranslations();
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

  const filtered = categories.filter((c) => {
    if (filter === "active") {
      return c.isActive;
    }
    if (filter === "inactive") {
      return !c.isActive;
    }
    return true;
  });

  function validateForm(form: FormState): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.name || form.name.length < 2) {
      errs.name = t("category.validation.nameMin");
    } else if (form.name.length > 80) {
      errs.name = t("category.validation.nameMax");
    }
    if (form.slug) {
      if (form.slug.length < 2 || form.slug.length > 50) {
        errs.slug = t("category.validation.slugLength");
      } else if (!/^[a-z0-9-]+$/.test(form.slug)) {
        errs.slug = t("validation.slugFormat");
      }
    }
    if (form.color && !/^#[0-9a-fA-F]{6}$/.test(form.color)) {
      errs.color = t("validation.invalidHexColor");
    }
    if (form.icon && form.icon.length > 50) {
      errs.icon = t("category.validation.iconMax");
    }
    if (form.description && form.description.length > 500) {
      errs.description = t("category.validation.descriptionMax");
    }
    const order = Number(form.sortOrder);
    if (
      Number.isNaN(order) ||
      !Number.isInteger(order) ||
      order < 0 ||
      order > 1000
    ) {
      errs.sortOrder = t("category.validation.sortOrder");
    }
    return errs;
  }

  function handleCreate() {
    const errs = validateForm(createForm);
    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs);
      return;
    }
    setCreateErrors({});

    startTransition(async () => {
      const payload = {
        color: createForm.color || null,
        description: createForm.description || null,
        icon: createForm.icon || null,
        isActive: createForm.isActive,
        name: createForm.name,
        sortOrder: Number(createForm.sortOrder),
        ...(createForm.slug ? { slug: createForm.slug } : {}),
      };
      const res = await createCategoryAction(payload);

      if (res?.data?.success && res.data.category) {
        const newCat = res.data.category as CategoryDTO;
        setCategories((prev) =>
          [...prev, newCat].sort((a, b) => a.sortOrder - b.sortOrder)
        );
        toast.success(t("category.toast.created"));
        setCreateOpen(false);
        setCreateForm(EMPTY_FORM);
      } else if (res?.validationErrors) {
        const flat = flattenValidationErrors(res.validationErrors);
        setCreateErrors(flat);
        toast.error(t("error.validationFailed"));
      } else if ((res as { serverError?: string }).serverError) {
        const msg = (res as { serverError?: string }).serverError as string;
        toast.error(t(msg as string));
        if (
          msg.toLowerCase().includes("already exists") ||
          msg.includes("409")
        ) {
          setCreateErrors((prev) => ({ ...prev, slug: msg }));
        }
      } else {
        toast.error(t("error.somethingWrong"));
      }
    });
  }

  function handleEdit() {
    if (!editing) {
      return;
    }
    const errs = validateForm(editForm);
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }
    setEditErrors({});

    startTransition(async () => {
      const data: Record<string, unknown> = {};
      if (editForm.name !== editing.name) {
        data.name = editForm.name;
      }
      if (editForm.slug !== editing.slug) {
        data.slug = editForm.slug;
      }
      if (editForm.description !== (editing.description ?? "")) {
        data.description = editForm.description || null;
      }
      if (editForm.icon !== (editing.icon ?? "")) {
        data.icon = editForm.icon || null;
      }
      if (editForm.color !== (editing.color ?? "")) {
        data.color = editForm.color || null;
      }
      if (Number(editForm.sortOrder) !== editing.sortOrder) {
        data.sortOrder = Number(editForm.sortOrder);
      }
      if (editForm.isActive !== editing.isActive) {
        data.isActive = editForm.isActive;
      }
      // Always send at least one field; if no diff, send name to avoid empty
      if (Object.keys(data).length === 0) {
        data.name = editForm.name;
      }

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

      if (res?.data?.success && res.data.category) {
        const updated = res.data.category as CategoryDTO;
        setCategories((prev) =>
          prev
            .map((c) => (c.id === updated.id ? updated : c))
            .sort((a, b) => a.sortOrder - b.sortOrder)
        );
        toast.success(t("category.toast.updated"));
        setEditOpen(false);
        setEditing(null);
      } else if (res?.validationErrors) {
        const flat = flattenValidationErrors(res.validationErrors);
        setEditErrors(flat);
        toast.error(t("error.validationFailed"));
      } else if ((res as { serverError?: string }).serverError) {
        const msg = (res as { serverError?: string }).serverError as string;
        toast.error(t(msg as string));
        if (msg.toLowerCase().includes("already exists")) {
          setEditErrors((prev) => ({ ...prev, slug: msg }));
        }
      } else {
        toast.error(t("error.somethingWrong"));
      }
    });
  }

  function handleDelete() {
    if (!deleting) {
      return;
    }
    setDeleteError(null);
    startTransition(async () => {
      const res = await deleteCategoryAction({ id: deleting.id });
      if (res?.data?.success) {
        setCategories((prev) => prev.filter((c) => c.id !== deleting.id));
        toast.success(t("category.toast.deleted"));
        setDeleteOpen(false);
        setDeleting(null);
      } else if (res?.validationErrors) {
        const flat = flattenValidationErrors(res.validationErrors);
        // delete validation is just id uuid — map to Alert
        setDeleteError(flat._errors ?? flat.id ?? "Validation failed");
        toast.error(t("error.validationFailed"));
      } else if (res?.serverError) {
        const msg = res.serverError;
        if (
          msg.includes("409") ||
          msg.toLowerCase().includes("challenges use") ||
          msg.toLowerCase().includes("cannot delete")
        ) {
          setDeleteError(msg);
        }
        toast.error(t(msg as string));
      } else {
        toast.error(t("error.somethingWrong"));
      }
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
            {t("common.navigation.categories")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("category.management.subtitle")}
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
          {t("category.actions.create")}
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-surface/70 p-4">
        <div className="flex items-center gap-3">
          <span className="font-medium text-muted-foreground text-xs">
            {t("category.filters.label")}
          </span>
          <Select
            onValueChange={(v) => setFilter(v as FilterValue)}
            value={filter}
          >
            <SelectTrigger
              aria-label={t("category.filters.byStatus")}
              className="h-9 min-w-36 rounded-lg border-border bg-inset px-3 text-foreground text-xs"
            >
              <SelectValue placeholder={t("category.filters.all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("category.filters.all")}</SelectItem>
              <SelectItem value="active">
                {t("category.filters.activeOnly")}
              </SelectItem>
              <SelectItem value="inactive">
                {t("category.filters.inactiveOnly")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden bg-surface shadow-xs">
        <Table>
          <TableHeader className="bg-inset/50">
            <TableRow>
              <TableHead className="px-4 py-3">
                {t("category.form.name")}
              </TableHead>
              <TableHead className="px-4 py-3">
                {t("category.form.slug")}
              </TableHead>
              <TableHead className="px-4 py-3">
                {t("category.form.icon")}
              </TableHead>
              <TableHead className="px-4 py-3">
                {t("category.form.color")}
              </TableHead>
              <TableHead className="px-4 py-3">
                {t("category.form.sortOrder")}
              </TableHead>
              <TableHead className="px-4 py-3">
                {t("category.table.status")}
              </TableHead>
              <TableHead className="px-4 py-3 text-end">
                {t("category.table.actions")}
              </TableHead>
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
                      <Badge variant="success">
                        {t("category.status.active")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {t("category.status.inactive")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        aria-label={t("category.actions.edit", {
                          name: cat.name,
                        })}
                        className="h-8 w-8 p-0"
                        onClick={() => openEdit(cat)}
                        size="icon"
                        variant="ghost"
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        aria-label={t("category.actions.delete", {
                          name: cat.name,
                        })}
                        className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-500/10 hover:text-rose-400"
                        onClick={() => openDelete(cat)}
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
                      <span>{t("category.empty.noCategories")}</span>
                      <Button
                        onClick={() => {
                          setCreateForm(EMPTY_FORM);
                          setCreateErrors({});
                          setCreateOpen(true);
                        }}
                        size="sm"
                      >
                        <Plus size={14} />
                        {t("category.actions.create")}
                      </Button>
                    </span>
                  ) : (
                    t("category.empty.noMatch")
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Dialog */}
      <Dialog onOpenChange={setCreateOpen} open={createOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("category.actions.create")}</DialogTitle>
            <DialogDescription>
              {t("category.create.subtitle")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-name">{t("category.form.name")}</Label>
              <Input
                id="create-name"
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder={t("category.names.reactRendering")}
                value={createForm.name}
              />
              {Boolean(createErrors.name) && (
                <span className="text-destructive text-xs">
                  {t(createErrors.name as string)}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-slug">
                {t("category.form.slugOptional")}
              </Label>
              <Input
                id="create-slug"
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, slug: e.target.value }))
                }
                placeholder={t("category.example.slug")}
                value={createForm.slug}
              />
              {Boolean(createErrors.slug) && (
                <span className="text-destructive text-xs">
                  {t(createErrors.slug as string)}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-description">
                {t("category.form.description")}
              </Label>
              <Input
                id="create-description"
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder={t("category.form.descriptionPlaceholder")}
                value={createForm.description}
              />
              {Boolean(createErrors.description) && (
                <span className="text-destructive text-xs">
                  {t(createErrors.description as string)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="create-icon">{t("category.form.icon")}</Label>
                <Input
                  id="create-icon"
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, icon: e.target.value }))
                  }
                  placeholder={t("category.form.layersIcon")}
                  value={createForm.icon}
                />
                {Boolean(createErrors.icon) && (
                  <span className="text-destructive text-xs">
                    {t(createErrors.icon as string)}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="create-color">{t("category.form.color")}</Label>
                <Input
                  id="create-color"
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, color: e.target.value }))
                  }
                  placeholder={t("category.example.color")}
                  value={createForm.color}
                />
                {Boolean(createErrors.color) && (
                  <span className="text-destructive text-xs">
                    {t(createErrors.color as string)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-sortOrder">
                {t("category.form.sortOrder")}
              </Label>
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
                  {t(createErrors.sortOrder as string)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-inset/50 px-3 py-2.5">
              <Label className="cursor-pointer" htmlFor="create-isActive">
                {t("category.status.active")}
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
              {t("common.actions.cancel")}
            </Button>
            <Button disabled={isPending} onClick={handleCreate}>
              {isPending
                ? t("common.actions.creating")
                : t("common.actions.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog onOpenChange={setEditOpen} open={editOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("category.edit.title")}</DialogTitle>
            <DialogDescription>{t("category.edit.subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">{t("category.form.name")}</Label>
              <Input
                id="edit-name"
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
                value={editForm.name}
              />
              {Boolean(editErrors.name) && (
                <span className="text-destructive text-xs">
                  {t(editErrors.name as string)}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-slug">{t("category.form.slug")}</Label>
              <Input
                id="edit-slug"
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, slug: e.target.value }))
                }
                value={editForm.slug}
              />
              {Boolean(editErrors.slug) && (
                <span className="text-destructive text-xs">
                  {t(editErrors.slug as string)}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-description">
                {t("category.form.description")}
              </Label>
              <Input
                id="edit-description"
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, description: e.target.value }))
                }
                value={editForm.description}
              />
              {Boolean(editErrors.description) && (
                <span className="text-destructive text-xs">
                  {t(editErrors.description as string)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-icon">{t("category.form.icon")}</Label>
                <Input
                  id="edit-icon"
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, icon: e.target.value }))
                  }
                  value={editForm.icon}
                />
                {Boolean(editErrors.icon) && (
                  <span className="text-destructive text-xs">
                    {t(editErrors.icon as string)}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-color">{t("category.form.color")}</Label>
                <Input
                  id="edit-color"
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, color: e.target.value }))
                  }
                  value={editForm.color}
                />
                {Boolean(editErrors.color) && (
                  <span className="text-destructive text-xs">
                    {t(editErrors.color as string)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-sortOrder">
                {t("category.form.sortOrder")}
              </Label>
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
                  {t(editErrors.sortOrder as string)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-inset/50 px-3 py-2.5">
              <Label className="cursor-pointer" htmlFor="edit-isActive">
                {t("category.status.active")}
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
              {t("common.actions.cancel")}
            </Button>
            <Button disabled={isPending} onClick={handleEdit}>
              {isPending
                ? t("common.actions.saving")
                : t("common.actions.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("category.delete.title")}</DialogTitle>
            <DialogDescription>
              {deleting
                ? t("category.delete.confirm", { name: deleting.name })
                : t("common.confirm.title")}
            </DialogDescription>
          </DialogHeader>
          {Boolean(deleteError) && (
            <Alert variant="destructive">
              <AlertDescription>
                {deleteError ? t(deleteError as string) : null}
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button onClick={() => setDeleteOpen(false)} variant="outline">
              {t("common.actions.cancel")}
            </Button>
            <Button
              disabled={isPending}
              onClick={handleDelete}
              variant="destructive"
            >
              {isPending
                ? t("common.actions.deleting")
                : t("common.actions.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
