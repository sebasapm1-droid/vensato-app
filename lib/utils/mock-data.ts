export const mockKpis = {
  monthlyIncome: 12500000,
  pendingPayments: 2,
  capRate: 8.4,
  activeProperties: 5,
};

export const mockProperties = [
  {
    id: "1",
    alias: "Apt 301 - Laureles",
    type: "Apartamento",
    city: "Medellín",
    currentRent: 2800000,
    capRate: 8.2,
    status: "occupied",
    tenant: "Carlos Martínez",
  },
  {
    id: "2",
    alias: "Local Comercial - Centro",
    type: "Local",
    city: "Bogotá",
    currentRent: 4500000,
    capRate: 9.5,
    status: "occupied",
    tenant: "Tech Store SAS",
  },
  {
    id: "3",
    alias: "Casa - Envigado",
    type: "Casa",
    city: "Envigado",
    currentRent: 3200000,
    capRate: 7.8,
    status: "vacant",
    tenant: null,
  },
  {
    id: "4",
    alias: "Apt 502 - Chicó",
    type: "Apartamento",
    city: "Bogotá",
    currentRent: 3800000,
    capRate: 8.0,
    status: "occupied",
    tenant: "María Fernanda López",
  },
];

export const mockTenants = [
  {
    id: "t1",
    fullName: "Carlos Martínez",
    email: "cmartinez@email.com",
    phone: "+57 300 123 4567",
    property: "Apt 301 - Laureles",
    contractStatus: "active",
    lastPaymentDate: "2026-03-01",
  },
  {
    id: "t2",
    fullName: "Tech Store SAS",
    email: "admin@techstore.co",
    phone: "+57 310 987 6543",
    property: "Local Comercial - Centro",
    contractStatus: "active",
    lastPaymentDate: "2026-03-05",
  },
  {
    id: "t3",
    fullName: "María Fernanda López",
    email: "mflopez@email.com",
    phone: "+57 315 555 1234",
    property: "Apt 502 - Chicó",
    contractStatus: "expiring",
    lastPaymentDate: "2026-03-02",
  },
];

export const mockCharges = [
  {
    id: "c1",
    tenant: "Carlos Martínez",
    property: "Apt 301 - Laureles",
    concept: "Arriendo Marzo",
    amount: 2800000,
    dueDate: "2026-03-05",
    status: "paid",
  },
  {
    id: "c2",
    tenant: "Tech Store SAS",
    property: "Local Comercial",
    concept: "Arriendo Marzo",
    amount: 4500000,
    dueDate: "2026-03-05",
    status: "overdue",
  },
  {
    id: "c3",
    tenant: "María Fernanda López",
    property: "Apt 502 - Chicó",
    concept: "Arriendo Marzo",
    amount: 3800000,
    dueDate: "2026-03-10",
    status: "paid",
  },
  {
    id: "c4",
    tenant: "Carlos Martínez",
    property: "Apt 301 - Laureles",
    concept: "Arriendo Abril",
    amount: 2800000,
    dueDate: "2026-04-05",
    status: "pending",
  },
];

export const mockContracts = [
  {
    id: "cnt1",
    property: "Apt 301 - Laureles",
    tenant: "Carlos Martínez",
    startDate: "2025-06-01",
    endDate: "2026-06-01",
    rentAmount: 2800000,
    incrementType: "IPC",
    status: "active",
  },
  {
    id: "cnt2",
    property: "Apt 502 - Chicó",
    tenant: "María Fernanda López",
    startDate: "2025-04-15",
    endDate: "2026-04-15",
    rentAmount: 3800000,
    incrementType: "Fijo 5%",
    status: "expiring", /* Vence en un mes */
  },
];

export const mockDocuments = [
  {
    id: "d1",
    name: "Contrato_Arrendamiento_301.pdf",
    type: "Contrato",
    property: "Apt 301 - Laureles",
    date: "2025-06-01",
    size: "2.4 MB",
  },
  {
    id: "d2",
    name: "Copia_Cedula_Carlos.pdf",
    type: "Identificación",
    property: "Apt 301 - Laureles",
    date: "2025-05-28",
    size: "1.1 MB",
  },
  {
    id: "d3",
    name: "Certificado_Libertad.pdf",
    type: "Matrícula",
    property: "Local Comercial",
    date: "2024-01-10",
    size: "4.5 MB",
  },
];

export const formatCOP = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
};
