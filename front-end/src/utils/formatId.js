//format rpt  id
export const formatReportId = (id) => {
    return `RPT-${String(id).padStart(5, "0")}`;
};

//format item  id
export const formatItemId = (id) => {
    return `SI-${String(id).padStart(5, "0")}`;
};
