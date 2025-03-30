import * as React from "react";
import RouterLink from "next/link";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DotsThree as DotsThreeIcon } from "@phosphor-icons/react/dist/ssr/DotsThree";

import { appConfig } from "@/config/app";
import { paths } from "@/paths";
import { BreadcrumbsSeparator } from "@/components/core/breadcrumbs-separator";
import { PostForm } from "@/components/dashboard/resource/post-form";

export const metadata = { title: `Create | Resource | Dashboard | ${appConfig.name}` };

export default function Page() {
	return (
		<Box
			sx={{
				maxWidth: "var(--Content-maxWidth)",
				m: "var(--Content-margin)",
				p: "var(--Content-padding)",
				width: "var(--Content-width)",
			}}
		>
			<Stack spacing={8}>
				<Stack spacing={1}>
					<Typography variant="h4">Create a new post</Typography>
					<Breadcrumbs separator={<BreadcrumbsSeparator />}>
						<Link color="text.primary" component={RouterLink} href={paths.dashboard.overview} variant="subtitle2">
							Dashboard
						</Link>
						<Link color="text.primary" component={RouterLink} href={paths.dashboard.resource.list} variant="subtitle2">
							Resource
						</Link>
						<Typography color="text.secondary" variant="subtitle2">
							Create
						</Typography>
					</Breadcrumbs>
				</Stack>
				<Card
					sx={{
						alignItems: "center",
						borderRadius: 1,
						boxShadow: "var(--mui-shadows-16)",
						display: "flex",
						justifyContent: "space-between",
						px: 3,
						py: 2,
					}}
				>
					<Typography variant="subtitle1">Hello, Sofia</Typography>
					<Stack direction="row" spacing={2} sx={{ alignItems: "center", display: { xs: "none", sm: "flex" } }}>
						<Button color="secondary" component={RouterLink} href={paths.dashboard.resource.list}>
							Cancel
						</Button>
						<Button component={RouterLink} href={paths.dashboard.resource.details("1")} variant="contained">
							Publish changes
						</Button>
						<IconButton>
							<DotsThreeIcon weight="bold" />
						</IconButton>
					</Stack>
				</Card>
				<PostForm />
				<Box sx={{ display: { sm: "none" } }}>
					<Button component={RouterLink} href={paths.dashboard.resource.details("1")} variant="contained">
						Publish changes
					</Button>
				</Box>
			</Stack>
		</Box>
	);
}
