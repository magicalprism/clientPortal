import { paths } from "@/paths";

export const dashboardConfig = {
	layout: "vertical",
	navColor: "evident",
	navItems: [
		{
			key: "dashboards",
			title: "Dashboards",
			items: [
				{ key: "overview", title: "Overview", href: paths.dashboard.overview, icon: "house" },
				{ key: "analytics", title: "Analytics", href: paths.dashboard.analytics, icon: "chart-pie" },
				{ key: "ecommerce", title: "E-commerce", href: paths.dashboard.eCommerce, icon: "cube" },
				{ key: "crypto", title: "Crypto", href: paths.dashboard.crypto, icon: "currency-eth" },
			],
		},
		{
			key: "general",
			title: "General",
			items: [
				{
					key: "settings",
					title: "Settings",
					href: paths.dashboard.settings.account,
					icon: "gear",
					matcher: { type: "startsWith", href: "/dashboard/settings" },
				},
				{
					key: "companies",
					title: "Companies",
					icon: "users",
					items: [
						{ key: "companies", title: "List companies", href: paths.dashboard.companies.list },
						{ key: "companies:create", title: "Create company", href: paths.dashboard.companies.create },

					],
				},
				{
					key: "contacts",
					title: "Contacts",
					icon: "users",
					items: [
						{ key: "contacts", title: "List contacts", href: paths.dashboard.contacts.list },
						{ key: "contacts:create", title: "Create contact", href: paths.dashboard.contacts.create },

					],
				},
				{
					key: "products",
					title: "Products",
					icon: "shopping-bag-open",
					items: [
						{ key: "products", title: "List products", href: paths.dashboard.products.list },
						{ key: "products:create", title: "Create product", href: paths.dashboard.products.create },
						{ key: "products:details", title: "Product details", href: paths.dashboard.products.details("1") },
					],
				},
				{
					key: "orders",
					title: "Orders",
					icon: "shopping-cart-simple",
					items: [
						{ key: "orders", title: "List orders", href: paths.dashboard.orders.list },
						{ key: "orders:create", title: "Create order", href: paths.dashboard.orders.create },
						{ key: "orders:details", title: "Order details", href: paths.dashboard.orders.details("1") },
					],
				},
				{
					key: "invoices",
					title: "Invoices",
					icon: "receipt",
					items: [
						{ key: "invoices", title: "List invoices", href: paths.dashboard.invoices.list },
						{ key: "invoices:create", title: "Create invoice", href: paths.dashboard.invoices.create },
						{ key: "invoices:details", title: "Invoice details", href: paths.dashboard.invoices.details("1") },
					],
				},
				{
					key: "onboarding",
					title: "Onboarding",
					icon: "read-cv-logo",
					items: [
						{ key: "index:onboarding", title: "Onboarding Forms", href: "/dashboard/onboarding" },
					],
				},
				{
					key: "jobs",
					title: "Jobs",
					icon: "read-cv-logo",
					items: [
						{ key: "jobs:browse", title: "Browse jobs", href: paths.dashboard.jobs.browse },
						{ key: "jobs:create", title: "Create job", href: paths.dashboard.jobs.create },
						{
							key: "jobs:company",
							title: "Company details",
							href: paths.dashboard.jobs.companies.overview("1"),
							matcher: { type: "startsWith", href: "/dashboard/jobs/companies/1" },
						},
					],
				},
				{
					key: "logistics",
					title: "Logistics",
					icon: "truck",
					items: [
						{ key: "logistics:metrics", title: "Metrics", href: paths.dashboard.logistics.metrics },
						{ key: "logistics:fleet", title: "Fleet", href: paths.dashboard.logistics.fleet },
					],
				},
				{
					key: "resource",
					title: "Resource",
					icon: "text-align-left",
					items: [
						{ key: "resource", title: "List posts", href: paths.dashboard.resource.list },
						{ key: "resource:create", title: "Create post", href: paths.dashboard.resource.create },
						{ key: "resource:details", title: "Post details", href: paths.dashboard.resource.details("1") },
					],
				},
				{
					key: "social",
					title: "Social",
					icon: "share-network",
					items: [
						{
							key: "social:profile",
							title: "Profile",
							href: paths.dashboard.social.profile.timeline,
							matcher: { type: "startsWith", href: "/dashboard/social/profile" },
						},
						{ key: "social:feed", title: "Feed", href: paths.dashboard.social.feed },
					],
				},
				{
					key: "academy",
					title: "Academy",
					icon: "graduation-cap",
					items: [
						{ key: "academy:browse", title: "Browse courses", href: paths.dashboard.academy.browse },
						{ key: "academy:course", title: "Course details", href: paths.dashboard.academy.details("1") },
					],
				},
				{ key: "file-storage", title: "File storage", href: paths.dashboard.fileStorage, icon: "upload" },
				{
					key: "mail",
					title: "Mail",
					href: paths.dashboard.mail.list("inbox"),
					icon: "envelope-simple",
					matcher: { type: "startsWith", href: "/dashboard/mail" },
				},
				{
					key: "chat",
					title: "Chat",
					href: paths.dashboard.chat.base,
					icon: "chats-circle",
					matcher: { type: "startsWith", href: "/dashboard/chat" },
				},
				{ key: "calendar", title: "Calendar", href: paths.dashboard.calendar, icon: "calendar-check" },
				{
					key: "tasks",
					title: "Tasks",
					icon: "kanban",
					items: [
						{ key: "tasks", title: "List tasks", href: paths.dashboard.tasks.list },
						{ key: "tasks:create", title: "Create contact", href: paths.dashboard.tasks.create },

					],
				},
			],
		},
		{
			key: "other",
			title: "Other",
			items: [
				{
					key: "auth",
					title: "Auth",
					icon: "lock",
					items: [
						{
							key: "auth:sign-in",
							title: "Sign in",
							items: [
								{ key: "auth:sign-in:centered", title: "Centered", href: "/auth/supabase/sign-in", },
							],
						},
						{
							key: "auth:sign-up",
							title: "Sign up",
							items: [
								{ key: "auth:sign-up:centered", title: "Centered", href: "/auth/supabase/sign-out", },

							],
						},
						{
							key: "auth:reset-password",
							title: "Reset password",
							items: [
								{ key: "auth:reset-password:split", title: "Split", href: "/auth/supabase/reset-password", },
							],
						},
						{
							key: "auth:update-password",
							title: "Update password",
							items: [
								{
									key: "auth:update-password:centered",
									title: "Centered",
									href: paths.auth.samples.updatePassword.centered,
								},
								{ key: "auth:update-password:split", title: "Split", href: paths.auth.samples.updatePassword.split },
							],
						},
						{
							key: "auth:verify-code",
							title: "Verify code",
							items: [
								{ key: "auth:verify-code:centered", title: "Centered", href: paths.auth.samples.verifyCode.centered },
								{ key: "auth:verify-code:split", title: "Split", href: paths.auth.samples.verifyCode.split },
							],
						},
					],
				},
				{ key: "pricing", title: "Pricing", href: paths.pricing, icon: "credit-card" },
				{ key: "checkout", title: "Checkout", href: paths.checkout, icon: "sign-out" },
				{ key: "contact", title: "Contact", href: paths.contact, icon: "address-book" },
				{
					key: "error",
					title: "Error",
					icon: "file-x",
					items: [
						{ key: "error:not-authorized", title: "Not authorized", href: paths.notAuthorized },
						{ key: "error:not-found", title: "Not found", href: paths.notFound },
						{ key: "error:internal-server-error", title: "Internal server error", href: paths.internalServerError },
					],
				},
			],
		},
		{
			key: "external",
			title: "External",
			items: [
				{ key: "managewp", title: "ManageWp", href: "https://orion.managewp.com/", external: true, icon: "link" },
				{ key: "gdrive", title: "Shared Drives", href: "https://drive.google.com/drive/u/0/shared-drives", external: true, icon: "link" },
				{ key: "flywp", title: "FlyWp", href: "https://app.flywp.com/servers", external: true, icon: "link" },
				{ key: "webstudio", title: "Web Studio", href: "https://apps.webstudio.is/dashboard", external: true, icon: "link" },
				{ key: "theme", title: "Devias Kit Docs", href: "https://material-kit-pro-react-docs-bslicwx3m-devias.vercel.app/welcome", external: true, icon: "link" },
			],
		},
	],
};
