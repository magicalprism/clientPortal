import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { Suspense, lazy } from "react";

// Optimize icon imports by importing from a single path
import { 
  ArrowRight, 
  Briefcase, 
  FileCode, 
  Info, 
  ListChecks, 
  Plus, 
  Users, 
  Warning 
} from "@phosphor-icons/react/dist/ssr";

import { appConfig } from "@/config/app";
import { dayjs } from "@/lib/dayjs";

// Import only the essential above-the-fold components eagerly
import { Summary } from "@/components/dashboard/overview/summary";

// Lazy load below-the-fold components for better performance
const AppChat = lazy(() => import("@/components/dashboard/overview/app-chat").then(mod => ({ default: mod.AppChat })));
const AppLimits = lazy(() => import("@/components/dashboard/overview/app-limits").then(mod => ({ default: mod.AppLimits })));
const AppUsage = lazy(() => import("@/components/dashboard/overview/app-usage").then(mod => ({ default: mod.AppUsage })));
const Events = lazy(() => import("@/components/dashboard/overview/events").then(mod => ({ default: mod.Events })));
const HelperWidget = lazy(() => import("@/components/dashboard/overview/helper-widget").then(mod => ({ default: mod.HelperWidget })));
const Subscriptions = lazy(() => import("@/components/dashboard/overview/subscriptions").then(mod => ({ default: mod.Subscriptions })));

export const metadata = { title: `Overview | Dashboard | ${appConfig.name}` };

// Loading fallback component for Suspense
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
    <CircularProgress />
  </Box>
);

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
			<Stack spacing={4}>
				<Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
					<Box sx={{ flex: "1 1 auto" }}>
						<Typography variant="h4">Overview</Typography>
					</Box>
					<div>
						<Button startIcon={<Plus />} variant="contained">
							Dashboard
						</Button>
					</div>
				</Stack>
				<Grid container spacing={4}>
					{/* Above-the-fold content loaded eagerly */}
					<Grid
						size={{
							md: 4,
							xs: 12,
						}}
					>
						<Summary amount={31} diff={15} icon={ListChecks} title="Tickets" trend="up" />
					</Grid>
					<Grid
						size={{
							md: 4,
							xs: 12,
						}}
					>
						<Summary amount={240} diff={5} icon={Users} title="Sign ups" trend="down" />
					</Grid>
					<Grid
						size={{
							md: 4,
							xs: 12,
						}}
					>
						<Summary amount={21} diff={12} icon={Warning} title="Open issues" trend="up" />
					</Grid>

					{/* Below-the-fold content lazy loaded with suspense */}
					<Grid
						size={{
							md: 8,
							xs: 12,
						}}
					>
						<Suspense fallback={<LoadingFallback />}>
							<AppUsage
								data={[
									{ name: "Jan", v1: 36, v2: 19 },
									{ name: "Feb", v1: 45, v2: 23 },
									{ name: "Mar", v1: 26, v2: 12 },
									{ name: "Apr", v1: 39, v2: 20 },
									{ name: "May", v1: 26, v2: 12 },
									{ name: "Jun", v1: 42, v2: 31 },
									{ name: "Jul", v1: 38, v2: 19 },
									{ name: "Aug", v1: 39, v2: 20 },
									{ name: "Sep", v1: 37, v2: 18 },
									{ name: "Oct", v1: 41, v2: 22 },
									{ name: "Nov", v1: 45, v2: 24 },
									{ name: "Dec", v1: 23, v2: 17 },
								]}
							/>
						</Suspense>
					</Grid>
					<Grid
						size={{
							md: 4,
							xs: 12,
						}}
					>
						<Suspense fallback={<LoadingFallback />}>
							<Subscriptions
								subscriptions={[
									{
										id: "supabase",
										title: "Supabase",
										icon: "/assets/company-avatar-5.png",
										costs: "$599",
										billingCycle: "year",
										status: "paid",
									},
									{
										id: "vercel",
										title: "Vercel",
										icon: "/assets/company-avatar-4.png",
										costs: "$20",
										billingCycle: "month",
										status: "expiring",
									},
									{
										id: "auth0",
										title: "Auth0",
										icon: "/assets/company-avatar-3.png",
										costs: "$20-80",
										billingCycle: "month",
										status: "canceled",
									},
									{
										id: "google_cloud",
										title: "Google Cloud",
										icon: "/assets/company-avatar-2.png",
										costs: "$100-200",
										billingCycle: "month",
										status: "paid",
									},
									{
										id: "stripe",
										title: "Stripe",
										icon: "/assets/company-avatar-1.png",
										costs: "$70",
										billingCycle: "month",
										status: "paid",
									},
								]}
							/>
						</Suspense>
					</Grid>
					<Grid
						size={{
							md: 4,
							xs: 12,
						}}
					>
						<Suspense fallback={<LoadingFallback />}>
							<AppChat
								messages={[
									{
										id: "MSG-001",
										content: "Hello, we spoke earlier on the phone",
										author: { name: "Alcides Antonio", avatar: "/assets/avatar-10.png", status: "online" },
										createdAt: dayjs().subtract(2, "minute").toDate(),
									},
									{
										id: "MSG-002",
										content: "Is the job still available?",
										author: { name: "Marcus Finn", avatar: "/assets/avatar-9.png", status: "offline" },
										createdAt: dayjs().subtract(56, "minute").toDate(),
									},
									{
										id: "MSG-003",
										content: "What is a screening task? I'd like to",
										author: { name: "Carson Darrin", avatar: "/assets/avatar-3.png", status: "online" },
										createdAt: dayjs().subtract(3, "hour").subtract(23, "minute").toDate(),
									},
									{
										id: "MSG-004",
										content: "Still waiting for feedback",
										author: { name: "Fran Perez", avatar: "/assets/avatar-5.png", status: "online" },
										createdAt: dayjs().subtract(8, "hour").subtract(6, "minute").toDate(),
									},
									{
										id: "MSG-005",
										content: "Need more information about campaigns",
										author: { name: "Jie Yan", avatar: "/assets/avatar-8.png", status: "offline" },
										createdAt: dayjs().subtract(10, "hour").subtract(18, "minute").toDate(),
									},
								]}
							/>
						</Suspense>
					</Grid>
					<Grid
						size={{
							md: 4,
							xs: 12,
						}}
					>
						<Suspense fallback={<LoadingFallback />}>
							<Events
								events={[
									{
										id: "EV-004",
										title: "Meeting with partners",
										description: "17:00 to 18:00",
										createdAt: dayjs().add(1, "day").toDate(),
									},
									{
										id: "EV-003",
										title: "Interview with Jonas",
										description: "15:30 to 16:45",
										createdAt: dayjs().add(4, "day").toDate(),
									},
									{
										id: "EV-002",
										title: "Doctor's appointment",
										description: "12:30 to 15:30",
										createdAt: dayjs().add(4, "day").toDate(),
									},
									{
										id: "EV-001",
										title: "Weekly meeting",
										description: "09:00 to 09:30",
										createdAt: dayjs().add(7, "day").toDate(),
									},
								]}
							/>
						</Suspense>
					</Grid>
					<Grid
						size={{
							md: 4,
							xs: 12,
						}}
					>
						<Suspense fallback={<LoadingFallback />}>
							<AppLimits usage={80} />
						</Suspense>
					</Grid>
					<Grid
						size={{
							md: 4,
							xs: 12,
						}}
					>
						<Suspense fallback={<LoadingFallback />}>
							<HelperWidget
								action={
									<Button color="secondary" endIcon={<ArrowRight />} size="small">
										Search jobs
									</Button>
								}
								description="Search for jobs that match your skills and apply to them directly."
								icon={Briefcase}
								label="Jobs"
								title="Find your dream job"
							/>
						</Suspense>
					</Grid>
					<Grid
						size={{
							md: 4,
							xs: 12,
						}}
					>
						<Suspense fallback={<LoadingFallback />}>
							<HelperWidget
								action={
									<Button color="secondary" endIcon={<ArrowRight />} size="small">
										Help center
									</Button>
								}
								description="Find answers to your questions and get in touch with our team."
								icon={Info}
								label="Help center"
								title="Need help figuring things out?"
							/>
						</Suspense>
					</Grid>
					<Grid
						size={{
							md: 4,
							xs: 12,
						}}
					>
						<Suspense fallback={<LoadingFallback />}>
							<HelperWidget
								action={
									<Button color="secondary" endIcon={<ArrowRight />} size="small">
										Documentation
									</Button>
								}
								description="Learn how to get started with our product and make the most of it."
								icon={FileCode}
								label="Documentation"
								title="Explore documentation"
							/>
						</Suspense>
					</Grid>
				</Grid>
			</Stack>
		</Box>
	);
}