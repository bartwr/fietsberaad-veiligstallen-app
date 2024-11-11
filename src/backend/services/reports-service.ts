import { IReportService } from "~/backend/handlers/report-service-interface";
import getTransactionsByPeriod, { GetTransactionsByPeriodParams, PeriodType, SelectType, OutputType } from "~/backend/services/reports/transactionsByPeriod";

export interface ReportData {
  title: string;
  options: {
    [x: string]: { title: { text: string; }; };
    xaxis: {
      categories: string[];
      title: {
        text: string;
        align: string;
      };
    };
    yaxis: {
      title: {
        text: string;
      };
    };
  };
  series: {
    name: string,
    data: any[]
  }[];
}

const ReportService: IReportService<ReportData | false> = {
  //   getStallingduurData: async () => {
  //     const data: ReportData = {
  //         title: "Stallingduur",
  //         columns: ["columnA", "columnB"],
  //         data: [["dataA1", 1], ["dataA2", 2]]
  //     }

  //     return data;
  //   },
  getTransactionsPerPeriodData: async (
    queryParams: { selectedGemeenteID: string; }
  ) => {
    try {
      const params: GetTransactionsByPeriodParams = {
        selectedGemeenteID: queryParams.selectedGemeenteID,
        zipID: "12345",
        startDate: new Date(2016, 5, 1),
        endDate: new Date(2016, 5, 30),
        periodType: PeriodType.YEAR,
        selectType: SelectType.STALLING,
        outputType: OutputType.TRANSACTIONS,
      }
      console.log('params', params)
      const data = await getTransactionsByPeriod(params);

      return data;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
};

export default ReportService;
