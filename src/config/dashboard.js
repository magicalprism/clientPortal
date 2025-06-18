import { paths } from "@/paths";
import * as Icons from "@phosphor-icons/react";

const Icon = ({ name }) => {
  const IconComponent = Icons[toPascalCase(name)]; // e.g., "address-book" → "AddressBook"
  return IconComponent ? <IconComponent size={20} /> : null;
};

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
			],
		},
		
		{
			key: "general",
			title: "General",
			items: [
				{
					key: "search",
					title: "Search",
					href: paths.dashboard.search,
					icon: "magnifying-glass",
				},
				{
					key: "settings",
					title: "Settings",
					href: paths.dashboard.settings.account,
					icon: "gear",
					matcher: { type: "startsWith", href: "/dashboard/settings" },
				},
				{
					key: "design",
					title: "Design Generator",
					href: "/dashboard/design-tool",
					icon: "gear",
			
				},
				{
					key: "project",
					title: "Projects",
					icon: "briefcase",
					items: [
						{ key: "project", title: "All Projects", href: paths.dashboard.project.list },
						{ key: "project:create", title: "Create Project", href: paths.dashboard.project.create },
						{ key: "element", title: "All Pages", href: paths.dashboard.element.list },
						{ key: "brand", title: "All Brands", href: paths.dashboard.brand.list },
						{ key: "proposal", title: "All Proposals", href: paths.dashboard.proposal.list },
						{ 
							key: "contract", 
							title: "Contracts", 
							items: 
							[
								{ key: "contract", title: "All Contracts", href: paths.dashboard.contract.list },
								{ key: "contractpart", title: "All Contract Parts", href: paths.dashboard.contractpart.list },
							]
						},
						

					],
				},
				{
					key: "ecommerce",
					title: "Shop",
					icon: "cart",
					items: [
						{ 
							key: "product", 
							title: "Products", 
							items: [
								{ key: "product", title: "Products", href: paths.dashboard.product.list },
								{ key: "deliverable", title: "Deliverables", href: paths.dashboard.deliverable.list },
						] 
					},
						

					],
				},
				{
					key: "calendar",
					title: "Calendar",
					icon: "calendar",

					items: [
						{
							key: "calendar",
							title: "Calendar",
							href: "/dashboard/calendar",
							icon: "event",
					
						},
						{ key: "event", title: "List events", href: paths.dashboard.event.list },
						{ key: "event:create", title: "Create event", href: paths.dashboard.event.create },
						
								

					],
				},
				{
					key: "task",
					title: "Tasks",
					icon: "kanban",
					items: [
						{ key: "task", title: "List tasks", href: paths.dashboard.task.list },
						{ key: "task:create", title: "Create task", href: paths.dashboard.task.create },

					],
				},
				{
					key: "company",
					title: "Companies",
					icon: "buildings",
					items: [
						{ key: "company", title: "List company", href: paths.dashboard.company.list },
						{ key: "company:create", title: "Create company", href: paths.dashboard.company.create },

					],
				},
				{
					key: "contact",
					title: "Contacts",
					icon: "address-book",
					items: [
						{ key: "contact", title: "List contacts", href: paths.dashboard.contact.list },
						{ key: "contact:create", title: "Create contact", href: paths.dashboard.contact.create },

					],
				},
				
				{
					key: "onboarding",
					title: "Onboarding",
					icon: "read-cv-logo",
					items: [
						{ key: "index:onboarding", title: "Onboarding Forms", href: "/dashboard/onboarding" },
						{ key: "onboarding:create", title: "Create onboarding form", href: paths.dashboard.onboarding.create },
					],
				},
				
				
				{
					key: "resource",
					title: "Resource",
					icon: "text-align-left",
					items: [
						{ key: "resource", title: "List resources", href: paths.dashboard.resource.list },
						{ key: "resource:create", title: "Create resource", href: paths.dashboard.resource.create },
						{ key: "resource:details", title: "Resource details", href: paths.dashboard.resource.details("1") },
					],
				},
				{
					key: "media",
					title: "Media & Files",
					icon: "file-storage",
					items: [
						{ key: "media", title: "List media", href: paths.dashboard.media.list },
						{ key: "media:create", title: "Create media", href: paths.dashboard.media.create },
						{ key: "media:details", title: "Media details", href: paths.dashboard.media.details("1") },
						{ key: "media:organize", title: "Organize Attachments", href: paths.dashboard.media.organize },
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
