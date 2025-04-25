"use client";

import * as React from "react";
import RouterLink from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import Link from "@mui/material/Link";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Eye as EyeIcon } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlash as EyeSlashIcon } from "@phosphor-icons/react/dist/ssr/EyeSlash";
import { Controller, useForm } from "react-hook-form";
import { z as zod } from "zod";

import { paths } from "@/paths";
import { createClient as createSupabaseClient } from "@/lib/supabase/browser";
import { DynamicLogo } from "@/components/core/logo";
import { toast } from "@/components/core/toaster";

const oAuthProviders = [
	{ id: "google", name: "Google", logo: "/assets/logo-google.svg" },
	{ id: "discord", name: "Discord", logo: "/assets/logo-discord.svg" },
];

const schema = zod.object({
	email: zod.string().min(1, { message: "Email is required" }).email(),
	password: zod.string().min(1, { message: "Password is required" }),
});

const defaultValues = { email: "", password: "" };

export function SignInForm() {
	const [supabaseClient] = React.useState(createSupabaseClient());
	const router = useRouter();
	const [showPassword, setShowPassword] = React.useState(false);
	const [isPending, setIsPending] = React.useState(false);

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm({ defaultValues, resolver: zodResolver(schema) });

	const onAuth = async (providerId) => {
		setIsPending(true);

		const redirectToUrl = new URL(paths.auth.supabase.callback.pkce, globalThis.location.origin);
		redirectToUrl.searchParams.set("next", paths.dashboard.overview);

		const { data, error } = await supabaseClient.auth.signInWithOAuth({
			provider: providerId,
			options: { redirectTo: redirectToUrl.href },
		});

		if (error) {
			setIsPending(false);
			toast.error(error.message);
			return;
		}

		globalThis.location.href = data.url;
	};
	const onSubmit = async (values) => {
		console.log("🟡 Form values:", values);
		setIsPending(true);
	
		const { data, error } = await supabaseClient.auth.signInWithPassword({
			email: values.email,
			password: values.password,
		});
	
		if (error) {
			console.error("❌ Sign-in error:", error.message);
			if (error.message.toLowerCase().includes("email not confirmed")) {
				const searchParams = new URLSearchParams({ email: values.email });
				router.push(`${paths.auth.supabase.signUpConfirm}?${searchParams.toString()}`);
				return;
			}
			setError("root", { type: "server", message: error.message });
			setIsPending(false);
			return;
		}
	
		console.log("✅ Sign-in success:", data);
	
		// 👇 Instead of just refreshing, redirect the user
		router.push(paths.dashboard.overview);
	};
	

	return (
		<Stack spacing={4}>
			<Box component={RouterLink} href={paths.home} sx={{ display: "inline-block", fontSize: 0 }}>
				<DynamicLogo colorDark="light" colorLight="dark" height={32} width={122} />
			</Box>

			<Stack spacing={1}>
				<Typography variant="h5">Sign in</Typography>
				<Typography color="text.secondary" variant="body2">
					Don&apos;t have an account?{" "}
					<Link component={RouterLink} href={paths.auth.supabase.signUp} variant="subtitle2">
						Sign up
					</Link>
				</Typography>
			</Stack>

			<Stack spacing={3}>
				<Stack spacing={2}>
					{oAuthProviders.map((provider) => (
						<Button
							key={provider.id}
							variant="outlined"
							color="secondary"
							disabled={isPending}
							onClick={() => onAuth(provider.id)}
							endIcon={<Box component="img" src={provider.logo} alt="" height={24} width={24} />}
						>
							Continue with {provider.name}
						</Button>
					))}
				</Stack>

				<Divider>or</Divider>

				<form onSubmit={handleSubmit(onSubmit)} noValidate>
					<Stack spacing={2}>
						<Controller
							control={control}
							name="email"
							render={({ field }) => (
								<FormControl error={Boolean(errors.email)}>
									<InputLabel>Email address</InputLabel>
									<OutlinedInput {...field} type="email" label="Email address" />
									{errors.email && <FormHelperText>{errors.email.message}</FormHelperText>}
								</FormControl>
							)}
						/>

						<Controller
							control={control}
							name="password"
							render={({ field }) => (
								<FormControl error={Boolean(errors.password)}>
									<InputLabel>Password</InputLabel>
									<OutlinedInput
										{...field}
										type={showPassword ? "text" : "password"}
										label="Password"
										endAdornment={
											showPassword ? (
												<EyeIcon
													cursor="pointer"
													fontSize="var(--icon-fontSize-md)"
													onClick={() => setShowPassword(false)}
												/>
											) : (
												<EyeSlashIcon
													cursor="pointer"
													fontSize="var(--icon-fontSize-md)"
													onClick={() => setShowPassword(true)}
												/>
											)
										}
									/>
									{errors.password && <FormHelperText>{errors.password.message}</FormHelperText>}
								</FormControl>
							)}
						/>

						{errors.root && <Alert severity="error">{errors.root.message}</Alert>}

						<Button type="submit" variant="contained" disabled={isPending}>
							Sign in
						</Button>
					</Stack>
				</form>

				<div>
					<Link component={RouterLink} href={paths.auth.supabase.resetPassword} variant="subtitle2">
						Forgot password?
					</Link>
				</div>
			</Stack>
		</Stack>
	);
}
