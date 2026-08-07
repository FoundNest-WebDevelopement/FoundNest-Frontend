const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
        timeZone: "Asia/Manila",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
};

export default formatTime;
