export const mockProperties: any[] = [];
export const mockTenants: any[] = [];
export const mockCharges: any[] = [];
export const mockContracts: any[] = [];
export const mockDocuments: any[] = [];

export const mockKpis = {
  monthlyIncome: 0,
  pendingPayments: 0,
  capRate: 0,
  activeProperties: 0,
};

export const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
