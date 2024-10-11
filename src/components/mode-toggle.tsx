"use client";

import useNextValue from "@/components/hooks/use-next-value";
import { cn } from "@/lib/utils";
import { SunMedium, Moon, SunMoon } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
	const [mounted, setMounted] = useState(false);
	const { setTheme, theme } = useTheme();
	const controlsSun = useAnimation();
	const controlsMoon = useAnimation();
	const controlsContrast = useAnimation();

	const iconVariants = {
		visible: {
			rotate: 0,
			scale: 1,
			opacity: 1,
		},
		hidden: {
			scale: 0,
			opacity: 0,
			rotate: 180,
		},
	};

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;

		if (theme === "system") {
			controlsSun.start("hidden");
			controlsContrast.start("visible");
			controlsMoon.start("hidden");
		} else {
			controlsSun.start(theme === "light" ? "visible" : "hidden");
			controlsMoon.start(theme === "dark" ? "visible" : "hidden");
			controlsContrast.start("hidden");
		}
	}, [mounted, controlsContrast, controlsMoon, controlsSun, theme]);

	const nextTheme = useNextValue(
		["light", "system", "dark"] as const,
		theme as string
	);

	if (!mounted) {
		return null;
	}

	return (
		<button
			className="cursor-pointer"
			onClick={() => setTheme(nextTheme)}
		>
			<motion.div
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.9 }}
				className={cn(
					"h-6 w-10 flex items-center bg-zinc-0 ring-1 ring-zinc-900/5 backdrop-blur dark:bg-zinc-800/30 dark:ring-white/10 rounded-full shadow-inner dark:shadow-black/10 relative"
				)}
			>
				<motion.div
					animate={{
						x: theme === "light" ? 4 : theme === "system" ? 12 : 20,
						transition: { duration: 0.1, easings: ["easeInOut"] },
					}}
					className="rounded-full size-4 relative"
				>
					<motion.div
						className="size-4 absolute top-0 left-0"
						variants={iconVariants}
						initial="hidden"
						animate={controlsSun}
					>
						<SunMedium className="size-4" />
					</motion.div>
					<motion.div
						className="size-4 absolute top-0 left-0"
						variants={iconVariants}
						initial="hidden"
						animate={controlsContrast}
					>
						<SunMoon className="size-4 dark:rotate-180" />
					</motion.div>
					<motion.div
						className="size-4 absolute top-0 left-0"
						variants={iconVariants}
						initial="hidden"
						animate={controlsMoon}
					>
						<Moon className="size-4" />
					</motion.div>
				</motion.div>
			</motion.div>
		</button>
	);
}