import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Plus as PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import { appConfig } from "@/config/app";
import { dayjs } from "@/lib/dayjs";
import { InvoicesFiltersCard } from "@/components/dashboard/invoice//invoices-filters-card";
import { InvoicesPagination } from "@/components/dashboard/invoice//invoices-pagination";
import { InvoicesStats } from "@/components/dashboard/invoice//invoices-stats";
import { InvoicesTable } from "@/components/dashboard/invoice//invoices-table";
import { ViewModeButton } from "@/components/dashboard/invoice//view-mode-button";
import { InvoicesFiltersButton } from "@/components/dashboard/invoice/invoices-filters-button";
import { InvoicesSort } from "@/components/dashboard/invoice/invoices-sort";

export const metadata = { title: `List | Invoices | Dashboard | ${appConfig.name}` };

const invoices = [
	{
		id: "INV-005",
		contact: { name: "Jie Yan", avatar: "/assets/avatar-8.png" },
		currency: "USD",
		totalAmount: 23.11,
		status: "pending",
		issueDate: dayjs().subtract(1, "hour").toDate(),
		dueDate: dayjs().add(25, "day").toDate(),
	},
	{
		id: "INV-004",
		contact: { name: "Omar Darobe", avatar: "/assets/avatar-11.png" },
		currency: "USD",
		totalAmount: 253.76,
		status: "paid",
		issueDate: dayjs().subtract(2, "hour").subtract(4, "day").toDate(),
		dueDate: dayjs().add(17, "day").toDate(),
	},
	{
		id: "INV-003",
		contact: { name: "Carson Darrin", avatar: "/assets/avatar-3.png" },
		currency: "USD",
		totalAmount: 781.5,
		status: "canceled",
		issueDate: dayjs().subtract(4, "hour").subtract(6, "day").toDate(),
		dueDate: dayjs().add(11, "day").toDate(),
	},
	{
		id: "INV-002",
		contact: { name: "Fran Perez", avatar: "/assets/avatar-5.png" },
		currency: "USD",
		totalAmount: 96.64,
		status: "paid",
		issueDate: dayjs().subtract(2, "hour").subtract(15, "day").toDate(),
		dueDate: dayjs().add(3, "day").toDate(),
	},
	{
		id: "INV-001",
		contact: { name: "Miron Vitold", avatar: "/assets/avatar-1.png" },
		currency: "USD",
		totalAmount: 19.99,
		status: "pending",
		issueDate: dayjs().subtract(2, "hour").subtract(15, "day").toDate(),
		dueDate: dayjs().add(1, "day").toDate(),
	},
];

export default async function Page({ searchParams }) {
	const { contact, endDate, id, sortDir, startDate, status, view = "group" } = await searchParams;

	const filters = { contact, endDate, id, startDate, status };

	const sortedInvoices = applySort(invoices, sortDir);
	const filteredInvoices = applyFilters(sortedInvoices, filters);

	return (
		<Box
			sx={{
				maxWidth: "var(--Content-maxWidth)",
				m: "var(--Content-margin)",
				p: "var(--Content-padding)",
				width: "var(--Content-width)",
			}}
		>
			<Stack spacing={4}>
				<Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
					<Box sx={{ flex: "1 1 auto" }}>
						<Typography variant="h4">Invoices</Typography>
					</Box>
					<div>
						<Button startIcon={<PlusIcon />} variant="contained">
							New
						</Button>
					</div>
				</Stack>
				<InvoicesStats />
				<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
					<InvoicesFiltersButton filters={filters} sortDir={sortDir} view={view} />
					<InvoicesSort filters={filters} sortDir={sortDir} view={view} />
					<ViewModeButton view={view} />
				</Stack>
				<Stack direction="row" spacing={4} sx={{ alignItems: "flex-start" }}>
					<InvoicesFiltersCard filters={filters} sortDir={sortDir} view={view} />
					<Stack spacing={4} sx={{ flex: "1 1 auto", minWidth: 0 }}>
						<InvoicesTable rows={filteredInvoices} view={view} />
						<InvoicesPagination count={filteredInvoices.length} page={0} />
					</Stack>
				</Stack>
			</Stack>
		</Box>
	);
}

// Sorting and filtering has to be done on the server.

function applySort(row, sortDir) {
	return row.sort((a, b) => {
		if (sortDir === "asc") {
			return a.issueDate.getTime() - b.issueDate.getTime();
		}

		return b.issueDate.getTime() - a.issueDate.getTime();
	});
}

function applyFilters(row, { contact, id, endDate, status, startDate }) {
	return row.filter((item) => {
		if (id && !item.id.toLowerCase().includes(id.toLowerCase())) {
			return false;
		}

		if (status && item.status !== status) {
			return false;
		}

		if (contact && !item.contact.name?.toLowerCase().includes(contact.toLowerCase())) {
			return false;
		}

		if (startDate && dayjs(item.issueDate).isBefore(dayjs(startDate))) {
			return false;
		}

		if (endDate && dayjs(item.issueDate).isAfter(dayjs(endDate).add(1, "day"))) {
			return false;
		}

		return true;
	});
}
