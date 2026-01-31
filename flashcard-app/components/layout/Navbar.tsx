"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import { logout } from "@/app/libs/auth";
import { Button } from "@/components/ui/button";
import { LogOut, BookOpen, Plus, LayoutDashboard } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { Menu } from "lucide-react";
function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col md:flex-row gap-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link key={item.href} href={item.href} onClick={onClick}>
            <div
              className={`
                relative px-4 py-2 rounded-lg font-medium text-sm
                flex items-center gap-2 transition
                ${
                  isActive
                    ? "text-violet-600 dark:text-violet-400 bg-violet-500/10"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/flashcards", label: "Flashcards", icon: BookOpen },
  { href: "/dashboard/add-word", label: "Add Word", icon: Plus },
  { href: "/dashboard/topics", label: "Topics", icon: BookOpen },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative border-b backdrop-blur-xl bg-white/70 dark:bg-gray-950/70 supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60"
    >
      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />

      <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
        {/* Navigation Links */}
        {/* Left */}
        <div className="flex items-center gap-2">
          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="w-64">
                <VisuallyHidden>
                  <SheetTitle>Navigation Menu</SheetTitle>
                </VisuallyHidden>

                <div className="flex flex-col gap-4 mt-6">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex">
            <NavLinks />
          </div>
        </div>

        {/* Right side actions */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <ThemeToggle />

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              onClick={logout}
              className="group relative overflow-hidden border-gray-300 dark:border-gray-700 hover:border-red-500/50 dark:hover:border-red-500/50"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-red-500/0 group-hover:from-red-500/10 group-hover:to-pink-500/10"
                initial={false}
                transition={{ duration: 0.3 }}
              />
              <LogOut className="w-4 h-4 mr-2 transition-transform group-hover:translate-x-1" />
              <span className="relative">Logout</span>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.nav>
  );
}
