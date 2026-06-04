function formatDateTime(date) {
  const d = new Date(date);

  const formattedDate = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${formattedDate} | ${formattedTime}`;
}

export default formatDateTime;