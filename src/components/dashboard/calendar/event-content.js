import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { taskTypeColors } from "@/styles/theme/colors"; // adjust path as needed
import { dayjs } from "@/lib/dayjs";

export function EventContent(arg) {
	const { priority = "low", type } = arg.event.extendedProps;

	const color =
		priority === "high"
			? "var(--mui-palette-error-main)"
			: priority === "medium"
				? "var(--mui-palette-warning-main)"
				: "transparent";

	const typeColor = taskTypeColors?.[type] || "#ccc";

	const startTime = arg.event.start ? dayjs(arg.event.start).format("h:mm A") : null;
	const endTime = arg.event.end ? dayjs(arg.event.end).format("h:mm A") : null;

	const inline =
		arg.event.start &&
		arg.event.end &&
		dayjs(arg.event.end).diff(dayjs(arg.event.start), "minute") < 30;

	return (
		<React.Fragment>
			<Box
				sx={{
					backgroundColor: typeColor || color,
					height: "100%",
					left: 0,
					position: "absolute",
					top: 0,
					width: "4px",
				}}
			/>
			<Box
				sx={{
					display: "flex",
					flexDirection: inline ? "row" : "column",
					gap: 1,
					pl: "8px",
					position: "sticky",
					top: 0,
				}}
			>
				{arg.event.allDay ? null : (
					<Typography sx={{ whiteSpace: "nowrap" }} variant="body2">
						{startTime} - {endTime}
					</Typography>
				)}
				<Typography noWrap variant="body2">
					{arg.event.title}
				</Typography>
			</Box>
		</React.Fragment>
	);
}
