function formatDateTime(date) {

    return new Date(date)
        .toLocaleString("en-US", {
            month: "numeric",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
}

export default formatDateTime;