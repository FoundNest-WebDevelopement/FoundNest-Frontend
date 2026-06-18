const formatDate = (timestamp) => {
    if (!timestamp) return "-";

    const date = new Date(timestamp);

    if (isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export default formatDate;