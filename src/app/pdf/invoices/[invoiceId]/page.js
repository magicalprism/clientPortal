"use client";

import * as React from "react";

import { PDFViewer } from "@react-pdf/renderer";
import { InvoicePDFDocument } from "@/components/dashboard/invoice/invoice-pdf-document";

export default function Page() {
	return (
		<PDFViewer style={{ border: "none", height: "100vh", width: "100vw" }}>
			<InvoicePDFDocument invoice={undefined} />
		</PDFViewer>
	);
}
