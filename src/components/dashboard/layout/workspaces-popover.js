"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

export function WorkspacesPopover({ anchorEl, companies = [], onChange, onClose, open = false }) {
        return (
                <Menu
                        anchorEl={anchorEl}
                        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                        onClose={onClose}
                        open={open}
                        slotProps={{ paper: { sx: { width: "250px" } } }}
                        transformOrigin={{ horizontal: "right", vertical: "top" }}
                >
                        {companies.map((company) => (
                                <MenuItem
                                        key={company.id}
                                        onClick={() => {
                                                onChange?.(company);
                                        }}
                                >
                                        <ListItemAvatar>
                                                <Avatar src={company.thumbnail?.url || undefined} sx={{ "--Avatar-size": "32px" }} variant="rounded" />
                                        </ListItemAvatar>
                                        {company.title}
                                </MenuItem>
                        ))}
                </Menu>
        );
}