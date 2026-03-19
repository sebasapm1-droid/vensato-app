import {
  Document, Page, Text, View, StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", padding: 40, fontSize: 10, color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28, paddingBottom: 16, borderBottom: "1 solid #e5e7eb" },
  logo: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#6B9080" },
  logoSub: { fontSize: 8, color: "#6b7280", marginTop: 2 },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", textAlign: "right", color: "#1a1a1a" },
  titleSub: { fontSize: 9, color: "#6b7280", textAlign: "right", marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", color: "#6b7280", letterSpacing: 1, marginBottom: 8 },
  row: { flexDirection: "row", marginBottom: 5 },
  label: { width: "40%", color: "#6b7280" },
  value: { width: "60%", fontFamily: "Helvetica-Bold" },
  divider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 16 },
  amountBox: { backgroundColor: "#f3f8f6", padding: 16, borderRadius: 6, marginVertical: 16 },
  amountLabel: { fontSize: 9, color: "#6b7280", marginBottom: 4 },
  amountValue: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#6B9080" },
  footer: { marginTop: 32, paddingTop: 12, borderTop: "1 solid #e5e7eb", fontSize: 8, color: "#9ca3af", textAlign: "center" },
  badge: { backgroundColor: "#fef3c7", padding: "4 10", borderRadius: 4, fontSize: 9, color: "#92400e", fontFamily: "Helvetica-Bold" },
});

const formatCOP = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);
const today = () => new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

interface Props {
  charge: { tenant: string; property: string; concept: string; amount: number; dueDate: string; status: string; };
  tenant?: { cedula?: string; email?: string; phone?: string; };
  owner: { fullName: string; nit: string; bankName: string; accountType: string; accountNumber: string; bankAccountKey?: string; accountHolder: string; };
}

export function CuentaDeCobro({ charge, tenant, owner }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>Vensato</Text>
            <Text style={styles.logoSub}>Sistema de Gestión Inmobiliaria</Text>
          </View>
          <View>
            <Text style={styles.title}>Cuenta de Cobro</Text>
            <Text style={styles.titleSub}>Emitida el {today()}</Text>
          </View>
        </View>

        {/* Monto */}
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>VALOR A PAGAR</Text>
          <Text style={styles.amountValue}>{formatCOP(charge.amount)}</Text>
          <Text style={{ fontSize: 9, color: "#6b7280", marginTop: 4 }}>Concepto: {charge.concept}</Text>
        </View>

        {/* Partes */}
        <View style={{ flexDirection: "row", gap: 20 }}>
          <View style={{ flex: 1, ...styles.section }}>
            <Text style={styles.sectionTitle}>Arrendatario</Text>
            <View style={styles.row}><Text style={styles.label}>Nombre:</Text><Text style={styles.value}>{charge.tenant}</Text></View>
            {tenant?.cedula && <View style={styles.row}><Text style={styles.label}>Cédula:</Text><Text style={styles.value}>{tenant.cedula}</Text></View>}
            {tenant?.email && <View style={styles.row}><Text style={styles.label}>Email:</Text><Text style={styles.value}>{tenant.email}</Text></View>}
            <View style={styles.row}><Text style={styles.label}>Inmueble:</Text><Text style={styles.value}>{charge.property}</Text></View>
          </View>
          <View style={{ flex: 1, ...styles.section }}>
            <Text style={styles.sectionTitle}>Propietario / Acreedor</Text>
            <View style={styles.row}><Text style={styles.label}>Nombre:</Text><Text style={styles.value}>{owner.fullName || "—"}</Text></View>
            <View style={styles.row}><Text style={styles.label}>NIT/CC:</Text><Text style={styles.value}>{owner.nit || "—"}</Text></View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Datos bancarios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos para Transferencia</Text>
          <View style={styles.row}><Text style={styles.label}>Banco:</Text><Text style={styles.value}>{owner.bankName || "—"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Tipo de cuenta:</Text><Text style={styles.value}>{owner.accountType || "—"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Número de cuenta:</Text><Text style={styles.value}>{owner.accountNumber || "—"}</Text></View>
          {owner.bankAccountKey && <View style={styles.row}><Text style={styles.label}>Llave (Celular):</Text><Text style={styles.value}>{owner.bankAccountKey}</Text></View>}
          <View style={styles.row}><Text style={styles.label}>Titular:</Text><Text style={styles.value}>{owner.accountHolder || owner.fullName || "—"}</Text></View>
        </View>

        <View style={styles.divider} />

        {/* Vencimiento */}
        <View style={styles.row}>
          <Text style={styles.label}>Fecha de vencimiento:</Text>
          <Text style={{ ...styles.value, color: "#e07a5f", fontFamily: "Helvetica-Bold" }}>{charge.dueDate}</Text>
        </View>

        <View style={styles.footer}>
          <Text>Generado automáticamente por Vensato · app.vensato.com · Este documento no reemplaza una factura electrónica</Text>
        </View>
      </Page>
    </Document>
  );
}
