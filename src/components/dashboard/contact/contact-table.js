"use client";

import * as React from "react";
import RouterLink from "next/link";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CheckCircle as CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { Clock as ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { Minus as MinusIcon } from "@phosphor-icons/react/dist/ssr/Minus";
import { PencilSimple as PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";

import { paths } from "@/paths";
import { dayjs } from "@/lib/dayjs";
import { DataTable } from "@/components/core/data-table";

import { useContactsSelection } from "./contact-selection-context";

const columns = [
	{
		formatter: (row) => (
			<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
				<Avatar src={row.avatar} />{" "}
				<div>
					<Link
						color="inherit"
						component={RouterLink}
						href={paths.dashboard.contacts.details(row.id)}
						sx={{ whiteSpace: "nowrap" }}
						variant="subtitle2"
					>
						{row.title}
					</Link>
					<Typography color="text.secondary" variant="body2">
						{row.title}
					</Typography>
				</div>
			</Stack>
		),
		title: "Name",
		width: "250px",
	},
	{ field: "email", title: "Email", width: "150px" },
	{ field: "tel", title: "Phone number", width: "150px" },

	{
		formatter: (row) => {
			const mapping = {
				client: { label: "Primary Client", icon: <CheckCircleIcon color="var(--mui-palette-success-main)" weight="fill" /> },
				team: { label: "Team", icon: <CheckCircleIcon color="var(--mui-palette-warning-main)" weight="fill" /> },
				archived: { label: "Archived", icon: <MinusIcon color="var(--mui-palette-error-main)" /> },
			};
			const { label, icon } = mapping[row.status] ?? { label: "Unknown", icon: null };

			return <Chip icon={icon} label={label} size="small" variant="outlined" />;
		},
		title: "Role",
		width: "150px",
	},
	{
		formatter: (row) => (
			<IconButton component={RouterLink} href={paths.dashboard.contacts.details(row.id)}>
				<PencilSimpleIcon />
			</IconButton>
		),
		title: "Actions",
		hideName: true,
		width: "100px",
		align: "right",
	},
];

export function ContactsTable({ rows }) {
	const { deselectAll, deselectOne, selectAll, selectOne, selected } = useContactsSelection();

	return (
		<React.Fragment>
			<DataTable
				columns={columns}
				onDeselectAll={deselectAll}
				onDeselectOne={(_, row) => {
					deselectOne(row.id);
				}}
				onSelectAll={selectAll}
				onSelectOne={(_, row) => {
					selectOne(row.id);
				}}
				rows={rows}
				selectable
				selected={selected}
			/>
			{rows.length === 0 ? (
				<Box sx={{ p: 3 }}>
					<Typography color="text.secondary" sx={{ textAlign: "center" }} variant="body2">
						No contacts found
					</Typography>
				</Box>
			) : null}
		</React.Fragment>
	);
}
