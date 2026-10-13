export function buildUpdateFormData({
    editForm,
    editImageFile,
    userId,
}) {
    const formData = new FormData();

    formData.append("item_name", editForm.item_name.trim());
    formData.append("category_id", editForm.category_id);
    formData.append("location_found", editForm.location_found.trim());
    formData.append("specific_location", editForm.specific_location);
    formData.append(
        "found_date",
        `${editForm.found_date} ${editForm.found_time}`
    );
    formData.append("description", editForm.description);
    formData.append("contents", editForm.contents);
    formData.append("reported_by", editForm.reported_by);
    formData.append("additional_notes", editForm.additional_notes);
    formData.append("office_id", editForm.office_id);
    formData.append("user_id", userId);

    if (editImageFile) {
        formData.append("image", editImageFile);
    }

    return formData;
}