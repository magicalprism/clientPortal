"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

export const workspaces = [
	{ name: "Lena Forrey, Inc.", avatar: "/assets/workspace-avatar-1.png" },
];

export function WorkspacesPopover({ anchorEl, onChange, onClose, open = false }) {
	return (
		<Menu
			anchorEl={anchorEl}
			anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
			onClose={onClose}
			open={open}
			slotProps={{ paper: { sx: { width: "250px" } } }}
			transformOrigin={{ horizontal: "right", vertical: "top" }}
		>
			{workspaces.map((workspace) => (
				<MenuItem
					key={workspace.name}
					onClick={() => {
						onChange?.(workspace.name);
					}}
				>
					<ListItemAvatar>
						<Avatar src={workspace.avatar} sx={{ "--Avatar-size": "32px" }} variant="rounded" />
					</ListItemAvatar>
					{workspace.name}
				</MenuItem>
			))}
		</Menu>
	);
}
