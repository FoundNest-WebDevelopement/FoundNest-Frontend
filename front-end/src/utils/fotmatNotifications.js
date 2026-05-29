function formatNotificationDate(timestamp) {

    const now = new Date();

    const created = new Date(timestamp);

    const diffMs = now - created;

    const diffSeconds =
        Math.floor(diffMs / 1000);

    const diffMinutes =
        Math.floor(diffSeconds / 60);

    const diffHours =
        Math.floor(diffMinutes / 60);

    // JUST NOW
    if (diffSeconds < 60) {

        return "Just now";
    }

    // MINUTES AGO
    if (diffMinutes < 60) {

        return `${diffMinutes}m ago`;
    }

    // HOURS AGO
    if (diffHours < 24) {

        return `${diffHours}h ago`;
    }

    // AFTER 24 HOURS
    return created.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}

export default formatNotificationDate;