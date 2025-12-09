import { t } from "@lingui/core/macro";
import { useEffect, useState } from "react";
import ContentEditable from "react-contenteditable";
import { HiXMark } from "react-icons/hi2";
import { twMerge } from "tailwind-merge";

import { usePopup } from "~/providers/popup";
import { useWorkspace } from "~/providers/workspace";
import { api } from "~/utils/api";

interface ChecklistItemRowProps {
  item: {
    publicId: string;
    title: string;
    itemValue: number;
    itemIdentity: string;
    quantity: number;
    wash: boolean;
    iron: boolean;
    completed: boolean;
  };
  cardPublicId: string;
  viewOnly?: boolean;
}

export default function ChecklistItemRow({
  item,
  cardPublicId,
  viewOnly,
}: ChecklistItemRowProps) {
  const utils = api.useUtils();
  const { showPopup } = usePopup();
  const { workspace } = useWorkspace();
  

  const [title, setTitle] = useState("");
  const [completed, setCompleted] = useState(false);
  const [iron, setIron] = useState(item.iron);
  const [wash, setWash] = useState(item.wash);
  const [itemValue, setItemValue] = useState(item.itemValue);
  const [quantity, setQuantity] = useState(item.quantity);

  const updateItem = api.checklist.updateItem.useMutation({
    onMutate: async (vars) => {
      await utils.card.byId.cancel({ cardPublicId });
      const previous = utils.card.byId.getData({ cardPublicId });
      utils.card.byId.setData({ cardPublicId }, (old) => {
        if (!old) return old as any;
        const updatedChecklists = old.checklists.map((cl) => ({
          ...cl,
          items: cl.items.map((ci) =>
            ci.publicId === item.publicId ? { ...ci, ...vars } : ci,
          ),
        }));
        return { ...old, checklists: updatedChecklists } as typeof old;
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        utils.card.byId.setData({ cardPublicId }, ctx.previous);
      showPopup({
        header: t`Unable to update checklist item`,
        message: t`Please try again later, or contact customer support.`,
        icon: "error",
      });
    },
    onSettled: async () => {
      await utils.card.byId.invalidate({ cardPublicId });
    },
  });

  const deleteItem = api.checklist.deleteItem.useMutation({
    onMutate: async () => {
      await utils.card.byId.cancel({ cardPublicId });
      const previous = utils.card.byId.getData({ cardPublicId });
      utils.card.byId.setData({ cardPublicId }, (old) => {
        if (!old) return old as any;
        const updatedChecklists = old.checklists.map((cl) => ({
          ...cl,
          items: cl.items.filter((ci) => ci.publicId !== item.publicId),
        }));
        return { ...old, checklists: updatedChecklists } as typeof old;
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        utils.card.byId.setData({ cardPublicId }, ctx.previous);
      showPopup({
        header: t`Unable to delete checklist item`,
        message: t`Please try again later, or contact customer support.`,
        icon: "error",
      });
    },
    onSettled: async () => {
      await utils.card.byId.invalidate({ cardPublicId });
    },
  });

  useEffect(() => {
    setTitle(item.title);
    setCompleted(item.completed);
    setIron(item.iron);
    setWash(item.wash);
    setItemValue(item.itemValue);
    setQuantity(item.quantity);
  }, [item.publicId]);

  const sanitizeHtmlToPlainText = (html: string): string =>
    html
      .replace(/<br\s*\/?>(\n)?/gi, "\n")
      .replace(/<div><br\s*\/?><\/div>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

  const handleToggleCompleted = () => {
    //if (viewOnly) return;
    setCompleted((prev) => !prev);
    updateItem.mutate({
      checklistItemPublicId: item.publicId,
      completed: !completed,
    });
  };
  const handleToggleIron = () => {
    if (viewOnly) return;
    setIron((prev) => !prev);
    updateItem.mutate({
      checklistItemPublicId: item.publicId,
      iron: !iron,
    });
  };
  const handleToggleWash = () => {
    if (viewOnly) return;
    setWash((prev) => !prev);
    updateItem.mutate({
      checklistItemPublicId: item.publicId,
      wash: !wash,
    });
  };

  const commitTitle = (rawHtml: string) => {
    if (viewOnly) return;
    const plain = sanitizeHtmlToPlainText(rawHtml);
    if (!plain || plain === item.title) {
      setTitle(item.title);
      return;
    }
    setTitle(plain);
    updateItem.mutate({
      checklistItemPublicId: item.publicId,
      title: plain,
    });
  };

  const handleDelete = () => {
    if (viewOnly) return;
    deleteItem.mutate({ checklistItemPublicId: item.publicId });
  };

  return (
    <div
      className={twMerge(
        "group relative mb-3 rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md",
        "border-light-300 dark:border-dark-300 dark:bg-dark-900",
        completed && "opacity-60",
      )}
    >
      {/* Main content wrapper */}
      <div className="p-4">
        {/* Top row: Checkbox + Title + Delete */}
        <div className="mb-3 flex items-start gap-3">
          <input
            type="checkbox"
            checked={completed}
            onChange={handleToggleCompleted}
            disabled={false}
            className={twMerge(
              "mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border",
              "border-light-400 dark:border-dark-500",
              "checked:bg-blue-500 checked:border-blue-500",
            )}
            aria-label={t`Mark as completed`}
          />
          
          <div className="min-w-0 flex-1">
            <ContentEditable
              html={title}
              disabled={viewOnly}
              onChange={(e) => setTitle(e.target.value)}
              // @ts-expect-error - valid event
              onBlur={(e: Event) => commitTitle(e.target.innerHTML as string)}
              className={twMerge(
                "min-h-[24px] w-full break-words text-base leading-6 outline-none",
                "text-neutral-900 dark:text-gray-100",
                viewOnly ? "cursor-default" : "cursor-text hover:text-neutral-700 dark:hover:text-white",
              )}
              placeholder={t`Add details...`}
              onKeyDown={(e) => {
                if (viewOnly) return;
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitTitle(title);
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setTitle(item.title);
                }
              }}
            />
          </div>

          {!viewOnly && (
            <button
              type="button"
              onClick={handleDelete}
              className={twMerge(
                "shrink-0 rounded p-1.5 transition-colors",
                "text-neutral-500 hover:bg-red-50 hover:text-red-600",
                "dark:text-dark-200 dark:hover:bg-red-900/20 dark:hover:text-red-400",
              )}
              aria-label={t`Delete item`}
            >
              <HiXMark size={18} />
            </button>
          )}
        </div>

        {/* Bottom row: Options and Values */}
        <div className="flex flex-wrap items-center gap-4 pl-8">
          {/* Service options */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-sm text-neutral-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={wash}
                disabled={workspace.role !== "admin"}
                onChange={handleToggleWash}
                className={twMerge(
                  "h-4 w-4 rounded border",
                  "border-light-400 dark:border-dark-500",
                  workspace.role !== "admin" ? "cursor-not-allowed" : "cursor-pointer",
                )}
              />
              <span>Lavagem</span>
            </label>

            <label className="flex items-center gap-1.5 text-sm text-neutral-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={iron}
                disabled={workspace.role !== "admin"}
                onChange={handleToggleIron}
                className={twMerge(
                  "h-4 w-4 rounded border",
                  "border-light-400 dark:border-dark-500",
                  workspace.role !== "admin" ? "cursor-not-allowed" : "cursor-pointer",
                )}
              />
              <span>Ferro</span>
            </label>
          </div>

          {/* Divider */}
          <div className="hidden h-5 w-px bg-light-300 dark:bg-dark-600 sm:block" />

          {/* Values */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-1.5 text-neutral-700 dark:text-gray-300">
              <span className="font-medium">Qtd:</span>
              <input
                type="number"
                value={quantity}
                min={1}
                disabled={viewOnly}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 1;
                  setQuantity(val);
                  updateItem.mutate({
                    checklistItemPublicId: item.publicId,
                    quantity: val,
                  });
                }}
                className={twMerge(
                  "w-16 rounded border px-2 py-1 text-center text-sm",
                  "border-light-300 bg-light-50 text-neutral-900",
                  "dark:border-dark-600 dark:bg-dark-800 dark:text-gray-100",
                  viewOnly ? "cursor-not-allowed opacity-50" : "cursor-text hover:border-light-400 dark:hover:border-dark-500",
                )}
              />
            </label>

            <div className="flex items-center gap-1.5 text-neutral-700 dark:text-gray-300">
              <span className="font-medium">Valor:</span>
              <span className="rounded bg-light-50 px-2 py-1 text-neutral-900 dark:bg-dark-800 dark:text-gray-100">
                R$ {itemValue.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-gray-100">
              <span>Total:</span>
              <span className="rounded bg-blue-50 px-2 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                R$ {(itemValue * quantity).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
