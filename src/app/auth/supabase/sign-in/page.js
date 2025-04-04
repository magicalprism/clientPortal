import * as React from "react";
import { redirect } from "next/navigation";

import { appConfig } from "@/config/app";
import { paths } from "@/paths";
import { logger } from "@/lib/default-logger";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { SplitLayout } from "@/components/auth/split-layout";
import { SignInForm } from "@/components/auth/supabase/sign-in-form";

export const metadata = { title: `Sign in | Supabase | Auth | ${appConfig.name}` };

export default async function Page() {
	const supabaseClient = await createSupabaseClient();
	const { data: { user } } = await supabaseClient.auth.getUser();

	if (user) {
		// Fetch the user's role from the contact table
		const { data: contact, error } = await supabaseClient
			.from("contact")
			.select("role")
			.eq("supabase_user_id", user.id)
			.single();

		if (error || !contact) {
			logger.error("[Sign in] Failed to fetch role from contact table", error);
			redirect("/error"); // optional error page
		}

		// Redirect based on role
		if (contact.role === "super-admin") {
			redirect(paths.dashboard.superAdmin); // ← change to your super admin route
		} else {
			redirect(paths.dashboard.overview); // regular user route
		}
	}

	return (
		<SplitLayout>
			<SignInForm />
		</SplitLayout>
	);
}
