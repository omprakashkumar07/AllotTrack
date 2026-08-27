export interface CalculationParams {
  ipo: {
    lotValue: number | null;
    lotSize: number | null;
  };
  application: {
    amountSent: number;
    sharesAllotted: number | null;
    amountTransferred: number | null;
    receivedFromApplicant: boolean;
    amountReceivedFromApplicant: number | null;
  };
}

export function calculateApplicationMetrics({ ipo, application }: CalculationParams) {
  const lotsApplied = ipo.lotValue ? Math.round(application.amountSent / ipo.lotValue) : 0;
  
  const lotsAllotted = (application.sharesAllotted !== null && ipo.lotSize) 
    ? Math.round(application.sharesAllotted / ipo.lotSize) 
    : null;
    
  const amountTransferred = application.amountTransferred ?? application.amountSent;
  
  const ipoAmount = application.amountSent;

  const profit = application.receivedFromApplicant && application.amountReceivedFromApplicant !== null 
    ? (application.amountReceivedFromApplicant || 0) - ipoAmount 
    : null;
    
  const profitPercent = profit !== null && ipoAmount > 0 
    ? (profit / ipoAmount) * 100 
    : null;

  return {
    lotsApplied,
    lotsAllotted,
    amountTransferred,
    profit,
    profitPercent
  };
}

export interface IpoApplicationAggregateParams {
  amountSent: number;
  amountTransferred: number | null;
  receivedFromApplicant: boolean;
  amountReceivedFromApplicant: number | null;
  applied?: boolean;
  allotmentStatus?: string;
}

export function calculateIpoAggregates(applications: IpoApplicationAggregateParams[]) {
  let idsApplied = 0;
  let idsAllotted = 0;
  let totalProfit = 0;
  let settledTransferred = 0;
  let anySettled = false;

  for (const app of applications) {
    if (app.applied) {
      idsApplied += 1;
    }
    if (app.allotmentStatus === 'allotted') {
      idsAllotted += 1;
    }

    if (app.receivedFromApplicant) {
      anySettled = true;
      const ipoAmount = app.amountSent;
      const received = app.amountReceivedFromApplicant ?? 0;
      
      totalProfit += (received - ipoAmount);
      settledTransferred += ipoAmount;
    }
  }

  const profitPercent = (anySettled && settledTransferred > 0) 
    ? (totalProfit / settledTransferred) * 100 
    : null;

  return {
    idsApplied,
    idsAllotted,
    totalProfit: anySettled ? totalProfit : null,
    profitPercent
  };
}
