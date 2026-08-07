// hooks/useEditItem.js

import { useState } from "react";
import { updateFoundReport } from "../services/foundReportModalServices";
import { buildUpdateFormData } from "../utils/buildUpdateFormData";

export function useSaveEditReport() {

    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const saveEdit = async ({
        reportId,
        editForm,
        editImageFile,
        userId,
    }) => {

        setIsSavingEdit(true);

        try {

            const formData = buildUpdateFormData({
                editForm,
                editImageFile,
                userId,
            });

            return await updateFoundReport(reportId, formData);

        } finally {

            setIsSavingEdit(false);

        }

    };

    return {
        saveEdit,
        isSavingEdit,
    };
}