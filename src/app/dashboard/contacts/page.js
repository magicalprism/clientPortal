import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Plus as PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import { appConfig } from "@/config/app";
import { dayjs } from "@/lib/dayjs";
import { createClient } from "@/lib/supabase/server";

// Component imports (PascalCase named exports, even if filenames are dashed)
import { ContactsFilters } from "@/components/dashboard/contact/contact-filters";
import { ContactsPagination } from "@/components/dashboard/contact/contact-pagination";
import { ContactsSelectionProvider } from "@/components/dashboard/contact/contact-selection-context";
import { ContactsTable } from "@/components/dashboard/contact/contact-table";

export const metadata = {
	title: `List | Contacts | Dashboard | ${appConfig.title}`,
};

export default async function Page({ searchParams }) {
	const supabase = await createClient();
	const { title, email, tel, sortDir, status } = searchParams;

	const { data: contactsRaw, error } = await supabase.from("contact").select("*");

	if (error) {
		console.error("Error loading contacts:", error.message);
	}

	const contacts = (contactsRaw || []).map((c) => ({
		...c,
		createdAt: dayjs(c.createdAt ?? c.created_at).toDate(),
	}));

	const sortedContacts = applySort(contacts, sortDir);
	const filteredContacts = applyFilters(sortedContacts, { title, email, tel, status });

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
						<Typography variant="h4">Contacts</Typography>
					</Box>
					<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
						<Button startIcon={<PlusIcon />} variant="contained">
							Add
						</Button>
					</Box>
				</Stack>
				<ContactsSelectionProvider contacts={filteredContacts}>
					<Card>
						<ContactsFilters filters={{ title, email, tel, status }} sortDir={sortDir} />
						<Divider />
						<Box sx={{ overflowX: "auto" }}>
							<ContactsTable rows={filteredContacts} />
						</Box>
						<Divider />
						<ContactsPagination count={filteredContacts.length + 100} page={0} />
					</Card>
				</ContactsSelectionProvider>
			</Stack>
		</Box>
	);
}

// Sort by createdAt
function applySort(rows, sortDir) {
	return rows.sort((a, b) => {
		if (sortDir === "asc") {
			return a.createdAt.getTime() - b.createdAt.getTime();
		}
		return b.createdAt.getTime() - a.createdAt.getTime();
	});
}

// Filter by email, tel, or status
function applyFilters(rows, { title, email, tel, status }) {
	return rows.filter((item) => {
		if (title && !item.title?.toLowerCase().includes(title.toLowerCase())) return false;
		if (email && !item.email?.toLowerCase().includes(email.toLowerCase())) return false;
		if (tel && !item.tel?.toLowerCase().includes(tel.toLowerCase())) return false;
		if (status && item.status !== status) return false;
		return true;
	});
}
