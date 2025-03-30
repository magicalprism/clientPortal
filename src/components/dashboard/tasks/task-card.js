"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Chat as ChatIcon } from "@phosphor-icons/react/dist/ssr/Chat";
import { Link as LinkIcon } from "@phosphor-icons/react/dist/ssr/Link";
import { List as ListIcon } from "@phosphor-icons/react/dist/ssr/List";

import { dayjs } from "@/lib/dayjs";

export function TaskCard({ onOpen, task }) {
	const {
		id,
		title,
		description,
		assignees = [],
		attachments = [],
		comments = [],
		subtasks = [],
		dueDate, // Expect this to be already normalized to JS Date
	} = task;

	const getDueText = () => {
		if (!dueDate) return null;

		const days = dayjs(dueDate).diff(dayjs(), "day");

		if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
		if (days === 0) return "Due today";
		if (days === 1) return "Due tomorrow";
		return `Due in ${days} days`;
	};

	return (
		<Card>
			<Stack spacing={2} sx={{ p: 3 }}>
				{dueDate && (
					<Typography color="text.secondary" variant="body2">
						{getDueText()}
					</Typography>
				)}

				<Stack spacing={0.5}>
					<Typography
						variant="subtitle1"
						role="button"
						tabIndex={0}
						sx={{
							cursor: "pointer",
							":hover": { color: "var(--mui-palette-primary-main)" },
						}}
						onClick={() => id && onOpen?.(id)}
						onKeyDown={(e) => e.key === "Enter" && id && onOpen?.(id)}
					>
						{title}
					</Typography>
					{description && <Typography variant="body2">{description}</Typography>}
				</Stack>

				<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
					{assignees.length > 0 && (
						<AvatarGroup>
							{assignees.map((assignee) => (
								<Avatar
									key={assignee.id}
									src={assignee.avatar || undefined}
									alt={assignee.name || "User"}
								/>
							))}
						</AvatarGroup>
					)}

					<Stack direction="row" spacing={1}>
						{attachments.length > 0 && <LinkIcon fontSize="var(--icon-fontSize-md)" />}
						{comments.length > 0 && <ChatIcon fontSize="var(--icon-fontSize-md)" />}
						{subtasks.length > 0 && <ListIcon fontSize="var(--icon-fontSize-md)" />}
					</Stack>
				</Stack>
			</Stack>
		</Card>
	);
}
