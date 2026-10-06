import { useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Upload } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import ConfirmDialog from "../global-components/ConfirmDialog";

export default function EditExportTemplateModal({ template, onClose, onUpdated }) {
    const API_URL = import.meta.env.VITE_API_URL;

    const [selectedFile, setSelectedFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [openConfirmReplace, setOpenConfirmReplace] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            setError("Only PDF files are allowed.");
            return;
        }

        setSelectedFile(file);
        setError("");
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            setIsSaving(true);
            setError("");
            setOpenConfirmReplace(false);

            const formData = new FormData();
            formData.append("template_file", selectedFile);

            const response = await fetchWithAuth(
                `${API_URL}/api/export-template`,
                {
                    method: "PUT",
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update export template.");
            }

            toast.success("Export template updated successfully.");
            onUpdated?.(data.template);
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to update export template.");
            toast.error(err.message || "Failed to update export template.");
        } finally {
            setIsSaving(false);
            setOpenConfirmReplace(false);
        }
    };

    return (
        <>
            {createPortal(
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1040]"
                    onClick={() => !isSaving && onClose()}
                >
                    <div
                        className="relative bg-white rounded-lg w-100 max-w-[90vw]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                            <p className="font-semibold">Upload Export Template</p>
                            <button onClick={onClose} disabled={isSaving} className="disabled:opacity-40 disabled:cursor-not-allowed">
                                <i className="fa-solid fa-x text-sm text-white" />
                            </button>
                        </div>

                        <div className="p-4 flex flex-col items-center gap-4">
                            <div className="w-28 h-28 rounded-lg bg-[#F5F5F5] border border-[#E5E1D8] flex items-center justify-center">
                                <FileText size={48} className="text-[#9A8F7C]" strokeWidth={1.5} />
                            </div>

                            {selectedFile && (
                                <p className="text-xs text-[#6B5C42] text-center break-all">
                                    {selectedFile.name}
                                </p>
                            )}

                            <label
                                className={`flex items-center gap-2 px-4 py-2 rounded-md border border-primary text-primary text-sm font-medium transition-transform active:scale-95
                                    ${isSaving ? "cursor-not-allowed opacity-40 pointer-events-none" : "cursor-pointer"}
                                `}
                            >
                                <Upload size={14} />
                                Choose PDF Template

                                <input
                                    type="file"
                                    accept="application/pdf"
                                    disabled={isSaving}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>


                            {error && <p className="text-xs text-[#C0392B]">{error}</p>}

                            <hr className="w-full border-(--color-tertiary) opacity-30 my-1" />

                            <div className="w-full flex gap-2">
                                <button
                                    type="button"
                                    className="flex-1 h-10 bg-primary rounded-lg text-white text-sm font-medium
                                    transition-transform duration-100 enabled:active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                    disabled={isSaving || !selectedFile}
                                    onClick={() =>
                                        template?.file_url ? setOpenConfirmReplace(true) : handleUpload()
                                    }
                                >
                                    {isSaving ? "Saving..." : "Save Template"}
                                </button>
                            </div>

                            <button
                                type="button"
                                className="w-full h-9 text-[#6B5C42] text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                disabled={isSaving}
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {openConfirmReplace && (
                <ConfirmDialog
                    title="Replace Export Template?"
                    cancelText="Cancel"
                    confirmText="Replace"
                    description="The current export template will be permanently deleted and replaced with this file."
                    disabled={isSaving}
                    onClose={() => setOpenConfirmReplace(false)}
                    onConfirm={handleUpload}
                />
            )}
        </>
    );
}
