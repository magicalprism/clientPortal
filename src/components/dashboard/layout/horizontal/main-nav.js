"use client";

import * as React from "react";
import RouterLink from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";

import { List as ListIcon } from "@phosphor-icons/react/dist/ssr/List";

import { paths } from "@/paths";
import { useColorScheme } from "@mui/material/styles";
import { Logo } from "@/components/core/logo";
import { WorkspacesSwitch } from "@/components/dashboard/layout/workspaces-switch";
import { MobileNav } from "@/components/dashboard/layout/mobile-nav";

import { navColorStyles } from "./styles";
import { isNavItemActive } from "@/lib/is-nav-item-active";
import { Dropdown } from "@/components/core/dropdown/dropdown";
import { DropdownPopover } from "@/components/core/dropdown/dropdown-popover";
import { DropdownTrigger } from "@/components/core/dropdown/dropdown-trigger";
import { icons } from "../nav-icons";

import SearchButton from "@/components/dashboard/layout/components/SearchButton";
import NotificationsButton from "@/components/dashboard/layout/components/NotificationsButton";
import ContactsButton from "@/components/dashboard/layout/components/ContactsButton";
import UserButton from "@/components/dashboard/layout/components/UserButton";

const logoColors = {
	dark: { blend_in: "light", discrete: "light", evident: "light" },
	light: { blend_in: "dark", discrete: "dark", evident: "light" },
};

export function MainNav({ color = "evident", items = [] }) {
	const pathname = usePathname();
	const [openNav, setOpenNav] = React.useState(false);
	const { colorScheme = "light" } = useColorScheme();

	const styles = navColorStyles[colorScheme][color];
	const logoColor = logoColors[colorScheme][color];

	return (
		<>
			<Box
				component="header"
				sx={{
					...styles,
					bgcolor: "var(--MainNav-background)",
					border: "var(--MainNav-border)",
					color: "var(--MainNav-color)",
					left: 0,
					position: "sticky",
					top: 0,
					zIndex: "var(--MainNav-zIndex)",
				}}
			>
				<Box
					sx={{
						display: "flex",
						flex: "1 1 auto",
						minHeight: "var(--MainNav-height, 72px)",
						px: { xs: 2, sm: 3 },
						py: 1,
					}}
				>
					<Stack direction="row" spacing={2} sx={{ alignItems: "center", flex: "1 1 auto" }}>
						<IconButton onClick={() => setOpenNav(true)} sx={{ display: { md: "none" } }}>
							<ListIcon color="var(--NavItem-icon-color)" />
						</IconButton>
						<Box
							component={RouterLink}
							href={paths.home}
							sx={{
								display: { xs: "none", md: "inline-block" },
								width: "100%",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Logo color={logoColor} height={50} width={200} />
						</Box>
						<Box sx={{ display: { xs: "none", md: "block" } }}>
							<WorkspacesSwitch />
						</Box>
					</Stack>
					<Stack
						direction="row"
						spacing={2}
						sx={{ alignItems: "center", flex: "1 1 auto", justifyContent: "flex-end" }}
					>
						<SearchButton />
						<NotificationsButton />
						<ContactsButton />
						<Divider
							flexItem
							orientation="vertical"
							sx={{ borderColor: "var(--MainNav-divider)", display: { xs: "none", md: "block" } }}
						/>
						<UserButton />
					</Stack>
				</Box>

				<Box
					component="nav"
					sx={{
						borderTop: "1px solid var(--MainNav-divider)",
						display: { xs: "none", md: "block" },
						minHeight: "56px",
						overflowX: "auto",
					}}
				>
					{renderNavGroups({ items, pathname })}
				</Box>
			</Box>

			<MobileNav items={items} open={openNav} onClose={() => setOpenNav(false)} />
		</>
	);
}

function renderNavGroups({ items = [], pathname }) {
	return (
		<Stack component="ul" direction="row" spacing={2} sx={{ listStyle: "none", m: 0, p: "8px 12px" }}>
			{items.map((group) => (
				<Box component="li" key={group.key} sx={{ flex: "0 0 auto" }}>
					{renderNavItems({ pathname, items: group.items })}
				</Box>
			))}
		</Stack>
	);
}

function renderNavItems({ items = [], pathname }) {
	return (
		<Stack component="ul" direction="row" spacing={2} sx={{ listStyle: "none", m: 0, p: 0 }}>
			{items.map(({ key, ...item }) => (
				<NavItem key={key} pathname={pathname} {...item} />
			))}
		</Stack>
	);
}

function NavItem({ disabled, external, items, href, icon, label, matcher, pathname, title }) {
	const active = isNavItemActive({ disabled, external, href, matcher, pathname });
	const Icon = icon ? icons[icon] : null;
	const isBranch = Boolean(items);

	const baseStyles = {
		alignItems: "center",
		borderRadius: 1,
		color: "var(--NavItem-color)",
		cursor: "pointer",
		display: "flex",
		gap: 1,
		p: "6px 16px",
		textDecoration: "none",
		whiteSpace: "nowrap",
	};

	const dynamicStyles = {
		...(disabled && {
			bgcolor: "var(--NavItem-disabled-background)",
			color: "var(--NavItem-disabled-color)",
			cursor: "not-allowed",
		}),
		...(active && {
			bgcolor: "var(--NavItem-active-background)",
			color: "var(--NavItem-active-color)",
		}),
		"&:hover": !disabled && !active
			? {
					bgcolor: "var(--NavItem-hover-background)",
					color: "var(--NavItem-hover-color)",
				}
			: {},
	};

	const element = (
		<Box
			component="li"
			sx={{ userSelect: "none" }}
		>
			<Box
				{...(href
					? {
							component: external ? "a" : RouterLink,
							href,
							target: external ? "_blank" : undefined,
							rel: external ? "noreferrer" : undefined,
					  }
					: { role: "button" })}
				sx={{ ...baseStyles, ...dynamicStyles }}
				tabIndex={0}
			>
				{Icon && (
					<Box sx={{ display: "flex", justifyContent: "center" }}>
						<Icon
							fill={active ? "var(--NavItem-icon-active-color)" : "var(--NavItem-icon-color)"}
							fontSize="var(--icon-fontSize-md)" weight={active ? "fill" : undefined}
						/>
					</Box>
				)}
				<Box sx={{ flex: "1 1 auto" }}>
					<Typography component="span" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
						{title}
					</Typography>
				</Box>
				{label && <Chip color="primary" label={label} size="small" />}
				{external && (
					<Box sx={{ display: "flex" }}>
						<ArrowSquareOutIcon fontSize="var(--icon-fontSize-sm)" />
					</Box>
				)}
				{isBranch && (
					<Box sx={{ display: "flex" }}>
						<CaretDownIcon fontSize="var(--icon-fontSize-sm)" />
					</Box>
				)}
			</Box>
		</Box>
	);

	if (isBranch) {
		return (
			<Dropdown>
				<DropdownTrigger>{element}</DropdownTrigger>
				<DropdownPopover PaperProps={{ sx: { minWidth: "200px", p: 1 } }}>
					{renderDropdownItems({ pathname, items })}
				</DropdownPopover>
			</Dropdown>
		);
	}

	return element;
}

function renderDropdownItems({ items = [], pathname }) {
	return (
		<Stack component="ul" spacing={1} sx={{ listStyle: "none", m: 0, p: 0 }}>
			{items.map(({ key, ...item }) => (
				<DropdownItem key={key} pathname={pathname} {...item} />
			))}
		</Stack>
	);
}

function DropdownItem({ disabled, external, items, href, matcher, pathname, title }) {
	const active = isNavItemActive({ disabled, external, href, matcher, pathname });
	const isBranch = Boolean(items);

	const baseStyles = {
		alignItems: "center",
		borderRadius: 1,
		color: "var(--NavItem-color)",
		cursor: "pointer",
		display: "flex",
		p: "6px 16px",
		whiteSpace: "nowrap",
	};

	const dynamicStyles = {
		...(disabled && {
			bgcolor: "var(--mui-palette-action-disabledBackground)",
			color: "var(--mui-action-disabled)",
			cursor: "not-allowed",
		}),
		...(active && {
			bgcolor: "var(--mui-palette-action-selected)",
			color: "var(--mui-palette-action-active)",
		}),
		"&:hover": !disabled && !active
			? {
					bgcolor: "var(--mui-palette-action-hover)",
					color: "var(--mui-palette-action-color)",
				}
			: {},
	};

	return (
		<Box component="li">
			<Box
				{...(href
					? {
							component: external ? "a" : RouterLink,
							href,
							target: external ? "_blank" : undefined,
							rel: external ? "noreferrer" : undefined,
					  }
					: { role: "button" })}
				sx={{ ...baseStyles, ...dynamicStyles }}
				tabIndex={0}
			>
				<Typography component="span" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
					{title}
				</Typography>
				{isBranch && (
					<Box sx={{ flex: "0 0 auto" }}>
						<CaretRightIcon fontSize="var(--icon-fontSize-sm)" />
					</Box>
				)}
			</Box>
		</Box>
	);
}
