export const paths = {
	home: "/",
	checkout: "/checkout",
	contact: "/contact",
	pricing: "/pricing",
	onboarding: (onboardingId) => `/onboarding/${onboardingId}`,
	auth: {
		custom: {
			signIn: "/auth/custom/sign-in",
			signUp: "/auth/custom/sign-up",
			signOut: "/auth/custom/sign-out",
			resetPassword: "/auth/custom/reset-password",
			profile: "/auth/custom/profile",
		},
		auth0: {
			callback: "/auth/auth0/callback",
			signIn: "/auth/auth0/sign-in",
			signUp: "/auth/auth0/sign-up",
			signOut: "/auth/auth0/sign-out",
			profile: "/auth/auth0/profile",
		},
		clerk: {
			signOut: "/auth/clerk/sign-out",
		},
		cognito: {
			callback: "/auth/cognito/callback",
			signIn: "/auth/cognito/sign-in",
			signOut: "/auth/cognito/sign-out",
		},
		supabase: {
			callback: { implicit: "/auth/supabase/callback/implicit", pkce: "/auth/supabase/callback/pkce" },
			signIn: "/auth/supabase/sign-in",
			signUp: "/auth/supabase/sign-up",
			signUpConfirm: "/auth/supabase/sign-up-confirm",
			signOut: "/auth/supabase/sign-out",
			resetPassword: "/auth/supabase/reset-password",
			recoveryLinkSent: "/auth/supabase/recovery-link-sent",
			updatePassword: "/auth/supabase/update-password",
		},
		samples: {
			signIn: { centered: "/auth/samples/sign-in/centered", split: "/auth/samples/sign-in/split" },
			signUp: { centered: "/auth/samples/sign-up/centered", split: "/auth/samples/sign-up/split" },
			updatePassword: {
				centered: "/auth/samples/update-password/centered",
				split: "/auth/samples/update-password/split",
			},
			resetPassword: { centered: "/auth/samples/reset-password/centered", split: "/auth/samples/reset-password/split" },
			verifyCode: { centered: "/auth/samples/verify-code/centered", split: "/auth/samples/verify-code/split" },
		},
	},
	dashboard: {
		overview: "/dashboard",
		settings: {
			account: "/dashboard/settings/account",
			billing: "/dashboard/settings/billing",
			integrations: "/dashboard/settings/integrations",
			notifications: "/dashboard/settings/notifications",
			security: "/dashboard/settings/security",
			team: "/dashboard/settings/team",
		},
		
		blank: "/dashboard/blank",
		resource: {
			list: "/dashboard/resource",
			details: (postId) => `/dashboard/resource/${postId}`,
			create: "/dashboard/resource/create",
		},
		brand: {
			list: "/dashboard/brand",
			create: "/dashboard/brand/create",
			details: (brandId) => `/dashboard/brand/${brandId}`,
		},

		company: {
			list: "/dashboard/company",
			create: "/dashboard/company/create",
			details: (companyId) => `/dashboard/company/${companyId}`,
		},
		contact: {
			list: "/dashboard/contact",
			create: "/dashboard/contact/create",
			details: (contactId) => `/dashboard/contact/${contactId}`,
		},
		element: {
			list: "/dashboard/element",
			create: "/dashboard/element/create",
			details: (elementId) => `/dashboard/element/${elementId}`,
		},
		onboarding: {
			list: "/dashboard/onboarding",
			create: "/dashboard/onboarding/create",
			details: (onboardingId) => `/dashboard/onboarding/${onboardingId}`,
			
		},
		media: {
			list: "/dashboard/media",
			create: "/dashboard/media/create",
			details: (mediaId) => `/dashboard/media/${mediaId}`,
		},
		project: {
			list: "/dashboard/project",
			create: "/dashboard/project/create",
			details: (projectId) => `/dashboard/project/${projectId}`,
		},
		

		
		
		task: {
			list: "/dashboard/task",
			create: "/dashboard/task/create",
			details: (taskId) => `/dashboard/task/${taskId}`,
			modalCreateWithRef: (refField, id) => `?modal=create&refField=${refField}&id=${id}`,
		},
	},
	
	components: {
		index: "/components",
		buttons: "/components/buttons",
		charts: "/components/charts",
		colors: "/components/colors",
		detailLists: "/components/detail-lists",
		forms: "/components/forms",
		gridLists: "/components/grid-lists",
		groupedLists: "/components/grouped-lists",
		inputs: "/components/inputs",
		modals: "/components/modals",
		quickStats: "/components/quick-stats",
		tables: "/components/tables",
		typography: "/components/typography",
	},
	


	notAuthorized: "/errors/not-authorized",
	notFound: "/errors/not-found",
	internalServerError: "/errors/internal-server-error",
	docs: "https://material-kit-pro-react-docs.devias.io",
	purchase: "https://mui.com/store/items/devias-kit-pro",
};
