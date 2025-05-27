import { tableCellClasses } from "@mui/material/TableCell";

export const MuiTableHead = {
	styleOverrides: {
		root: {
			[`& .${tableCellClasses.root}`]: {
				backgroundColor: "var(--mui-palette-text-primary)",
				color: "white",
				lineHeight: 1,
			},
		},
	},
};
