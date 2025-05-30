"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Info as InfoIcon } from "@phosphor-icons/react/dist/ssr/Info";

import { DataTable } from "@/components/core/data-table";

const entries = [
	{ url: "/", visitors: 95_847, uniqueVisits: 8584, bounceRate: 16 },
	{ url: "/auth/login", visitors: 7500, uniqueVisits: 648, bounceRate: 5 },
	{ url: "/dashboard", visitors: 85_406, uniqueVisits: 568, bounceRate: 2 },
	{ url: "/resource/top-5-react-frameworks", visitors: 75_050, uniqueVisits: 12_322, bounceRate: 12 },
	{ url: "/resource/understand-programming-principles", visitors: 68_003, uniqueVisits: 11_645, bounceRate: 10 },
	{ url: "/resource/design-patterns", visitors: 49_510, uniqueVisits: 10_259, bounceRate: 8 },
];

const columns = [
	{
		formatter: (row) => (
			<Typography sx={{ whiteSpace: "nowrap" }} variant="inherit">
				{row.url}
			</Typography>
		),
		name: "URL",
	},
	{
		formatter: (row) => {
			return new Intl.NumberFormat("en-US").format(row.visitors);
		},
		name: "Visitors",
		width: "150px",
	},
	{
		formatter: (row) => {
			return new Intl.NumberFormat("en-US").format(row.uniqueVisits);
		},
		name: "Unique Visits",
		width: "150px",
	},
	{
		formatter: (row) => {
			return new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 2 }).format(
				row.bounceRate / 100
			);
		},
		name: "Bounce Rate",
		width: "150px",
		align: "right",
	},
];

export function Table7() {
	return (
		<Box sx={{ bgcolor: "var(--mui-palette-background-level1)", p: 3 }}>
			<Card>
				<CardHeader
					action={
						<Tooltip title="Refresh rate is 24h">
							<InfoIcon />
						</Tooltip>
					}
					title="Most visited pages"
				/>
				<Divider />
				<Box sx={{ overflowX: "auto" }}>
					<DataTable columns={columns} rows={entries} />
				</Box>
			</Card>
		</Box>
	);
}
