"use client";

import * as React from "react";
import { createClient as createSupabaseClient } from "@/lib/supabase/browser";

export const AuthContext = React.createContext({
	isAuthenticated: false,
	isLoading: true,
	user: null,
});

export const AuthProvider = ({ children }) => {
	const [supabaseClient] = React.useState(createSupabaseClient());

	const [state, setState] = React.useState({
		isAuthenticated: false,
		isLoading: true,
		user: null,
	});

	// ✅ Get current session on initial load
	React.useEffect(() => {
		const getSession = async () => {
			const { data, error } = await supabaseClient.auth.getSession();
			const user = data?.session?.user ?? null;

			setState({
				isAuthenticated: Boolean(user),
				isLoading: false,
				user,
			});
		};

		getSession();

		// ✅ Listen to auth state changes
		const {
			data: { subscription },
		} = supabaseClient.auth.onAuthStateChange((_event, session) => {
			const user = session?.user ?? null;

			setState({
				isAuthenticated: Boolean(user),
				isLoading: false,
				user,
			});
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [supabaseClient]);

	return (
		<AuthContext.Provider value={{ ...state }}>
			{children}
		</AuthContext.Provider>
	);
};

export function useAuth() {
	const context = React.useContext(AuthContext);

	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}

	return context;
}
/*//removes authorization

"use client";

import * as React from "react";

// 🔁 Don't import Supabase if you're bypassing it
// import { createClient as createSupabaseClient } from "@/lib/supabase/browser";

export const AuthContext = React.createContext({
	isAuthenticated: true,
	isLoading: false,
	user: {
		id: "mock-user",
		email: "bypass@localhost",
		role: "Super Admin",
	},
});

export const AuthProvider = ({ children }) => {
	// ❌ Skip supabase client entirely
	// const [supabaseClient] = React.useState(createSupabaseClient());

	const [state, setState] = React.useState({
		isAuthenticated: true,
		isLoading: false,
		user: {
			id: "mock-user",
			email: "bypass@localhost",
			role: "Super Admin",
		},
	});

	// ✅ Skip useEffect completely — nothing to fetch or listen to
	// This keeps it synchronous and stable even offline

	return (
		<AuthContext.Provider value={{ ...state }}>
			{children}
		</AuthContext.Provider>
	);
};

export function useAuth() {
	const context = React.useContext(AuthContext);

	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}

	return context;
}
*/
