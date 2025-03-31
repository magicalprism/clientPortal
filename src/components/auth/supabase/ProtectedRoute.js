"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/supabase/auth-context";

// Define public routes that don't need auth
const publicRoutes = ["/auth/supabase/sign-in", "/auth/supabase/sign-out", "/auth/supabase/register", "/auth/supabase/forgot-password"];

export const ProtectedRoute = ({ children }) => {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		const isPublic = publicRoutes.includes(pathname);

		if (!isLoading && !isAuthenticated && !isPublic) {
			router.push("/auth/supabase/sign-in");
		}
	}, [isLoading, isAuthenticated, pathname, router]);

	if (isLoading) return <div>Loading...</div>;

	// Allow access to public pages or if authenticated
	if (isAuthenticated || publicRoutes.includes(pathname)) {
		return children;
	}

	return null; // Avoid flashing protected content
};
