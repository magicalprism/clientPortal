"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CaretUpDown as CaretUpDownIcon } from "@phosphor-icons/react/dist/ssr/CaretUpDown";

import { appConfig } from "@/config/app";
import { usePopover } from "@/hooks/use-popover";
import { createClient } from "@/lib/supabase/browser";
import { setSettings as setPersistedSettings } from "@/lib/settings";
import { useSettings } from "@/components/core/settings/settings-context";
import { WorkspacesPopover } from "./workspaces-popover";

// Create the Supabase client once so that we don't re-instantiate it on every render
const supabase = createClient();

export function WorkspacesSwitch() {
        const popover = usePopover();
        const router = useRouter();
        const { settings } = useSettings();
        const [companies, setCompanies] = React.useState([]);
        const [workspace, setWorkspace] = React.useState(null);

        React.useEffect(() => {
                const fetchCompanies = async () => {
                        const { data, error } = await supabase
                                .from("company")
                                .select(
                                        "id, title, thumbnail:thumbnail_id(url), brand:brand_id(primary_color)"
                                )
                                .eq("is_client", true)
                                .neq("status", "archived");

                        if (!error) {
                                setCompanies(data || []);
                        }
                };

                fetchCompanies();
        }, []);

        React.useEffect(() => {
                if (companies.length && !workspace) {
                        const current =
                                companies.find((c) => c.id === settings.currentCompanyId) ||
                                companies[0];
                        setWorkspace(current);
                }
        }, [companies, settings.currentCompanyId, workspace]);

        const handleChange = async (company) => {
                setWorkspace(company);
                await setPersistedSettings({
                        ...settings,
                        primaryColor: company.brand?.primary_color ?? appConfig.primaryColor,
                        currentCompanyId: company.id,
                });
                router.refresh();
                popover.handleClose();
        };

        if (!workspace) {
                return null;
        }

        return (
                <React.Fragment>
                        <Stack
                                direction="row"
                                onClick={popover.handleOpen}
                                ref={popover.anchorRef}
                                spacing={2}
                                sx={{
                                        alignItems: "center",
                                        border: "1px solid var(--Workspaces-border-color)",
                                        borderRadius: "12px",
                                        cursor: "pointer",
                                        p: "4px 8px",
                                }}
                        >
                                <Avatar src={workspace.thumbnail?.url || undefined} variant="rounded" />
                                <Box sx={{ flex: "1 1 auto", margin: "0px" }}>
                                        <Typography color="var(--Workspaces-title-color)" variant="caption">
                                                Workspace
                                        </Typography>
                                        <Typography color="var(--Workspaces-name-color)" variant="subtitle2">
                                                {workspace.title}
                                        </Typography>
                                </Box>
                                <CaretUpDownIcon color="var(--Workspaces-expand-color)" fontSize="var(--icon-fontSize-sm)" />
                        </Stack>
                        <WorkspacesPopover
                                anchorEl={popover.anchorRef.current}
                                companies={companies}
                                onChange={handleChange}
                                onClose={popover.handleClose}
                                open={popover.open}
                        />
                </React.Fragment>
        );
	}