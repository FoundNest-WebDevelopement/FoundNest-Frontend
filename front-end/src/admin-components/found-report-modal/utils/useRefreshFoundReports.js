import { getFoundReports } from "../services/foundReportModalServices";

export function useRefreshFoundReports({
    onUpdated,
    selectedItem,
    setSelectedItem,
}) {

    const refreshReports = async () => {

        const refreshedReports = await getFoundReports();

        if (!Array.isArray(refreshedReports)) {
            return;
        }

        onUpdated?.(refreshedReports);

        const updatedSelected = refreshedReports.find(
            report =>
                report.found_report_id === selectedItem?.found_report_id
        );

        if (updatedSelected) {
            setSelectedItem(updatedSelected);
        }

        return refreshedReports;
    };

    return {
        refreshReports,
    };
}