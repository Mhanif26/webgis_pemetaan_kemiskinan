import { useId, useMemo, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileUp, FileText, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

type DocumentUploadFieldProps = {
  label: string;
  value?: string | null;
  onChange?: (value: string | null) => void;
  required?: boolean;
  helperText?: string;
  accept?: string;
  className?: string;
};

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

function getPreviewKind(value?: string | null) {
  if (!value) return "none";
  if (value.startsWith("data:application/pdf")) return "pdf";
  if (value.startsWith("data:image/")) return "image";
  return "file";
}

export function DocumentUploadField({
  label,
  value,
  onChange,
  required = false,
  helperText,
  accept = "image/*,application/pdf",
  className = "",
}: DocumentUploadFieldProps) {
  const inputId = useId();
  const previewKind = useMemo(() => getPreviewKind(value), [value]);

  const handleSelectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onChange) return;

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      toast.error("Pastikan gambar tidak lebih besar dari 2mb");
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    onChange(dataUrl);
  };

  const canEdit = Boolean(onChange);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={inputId} className="text-xs font-medium">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </Label>
        {canEdit && value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={() => onChange?.(null)}
          >
            <X className="h-3 w-3 mr-1" />
            Hapus
          </Button>
        ) : null}
      </div>
      {helperText ? <p className="text-[11px] text-muted-foreground">{helperText}</p> : null}
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleSelectFile}
        disabled={!canEdit}
      />
      <label
        htmlFor={inputId}
        className={`block cursor-pointer rounded-xl border border-dashed p-4 transition-colors ${
          value ? "bg-muted/20 hover:bg-muted/30" : "bg-background hover:bg-muted/20"
        } ${!canEdit ? "cursor-default" : ""}`}
      >
        {value ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {previewKind === "image" ? (
                <ImageIcon className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              <span>Dokumen siap dipreview</span>
            </div>
            {previewKind === "image" ? (
              <img
                src={value}
                alt={label}
                className="h-40 w-full rounded-lg border object-contain bg-white"
              />
            ) : previewKind === "pdf" ? (
              <iframe
                src={value}
                title={label}
                className="h-40 w-full rounded-lg border bg-white"
              />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-lg border bg-white text-xs text-muted-foreground">
                File terunggah
              </div>
            )}
            {canEdit ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileUp className="h-3.5 w-3.5" />
                Klik untuk mengganti file
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <FileUp className="h-6 w-6" />
            <p className="text-sm font-medium">Klik untuk upload atau seret file ke sini</p>
            <p className="text-[11px]">{accept.toUpperCase()} {required ? "- Wajib" : "- Opsional"}</p>
          </div>
        )}
      </label>
    </div>
  );
}