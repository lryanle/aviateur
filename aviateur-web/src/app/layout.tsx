import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Arimo } from "next/font/google";
import "./globals.css";
import Nav from "./nav";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const arimo = Arimo({
	variable: "--font-arimo",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
	title: "Create Next App",
	description: "Generated by create next app",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ClerkProvider>
			<html lang="en">
				<body
					className={`${geistSans.variable} ${geistMono.variable} ${arimo.variable} antialiased font-arimo text-white bg-aa-gray`}
				>
					<Nav />
					{children}
				</body>
			</html>
		</ClerkProvider>
	);
}
