"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useOrganization } from "../../app/context/OrganizationContext";
import { motion } from "framer-motion";

export default function QuickAccessPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { selectedOrg } = useOrganization();

  const [open, setOpen] = useState(false);
  const currentStep = searchParams.get("step");

  const navItems = [
    { label: "Choose Organization", path: "/generate?step=org" },
    { label: "Select Type", path: "/generate?step=type", requiresOrg: true },
    { label: "Single", path: "/generate-single", requiresOrg: true },
    { label: "Batch", path: "/generate-batch", requiresOrg: true },
  ];

  const handleNavigate = (item: typeof navItems[0]) => {
    if (item.requiresOrg && !selectedOrg) {
      alert("Please select an organization first!");
      router.push("/generate?step=org");
      return;
    }
    router.push(item.path);
    setOpen(false); // close panel on mobile after navigation
  };

  const isActive = (itemPath: string) => {
    if (itemPath.startsWith("/generate?")) {
      const step = new URLSearchParams(itemPath.split("?")[1]).get("step");
      return pathname === "/generate" && currentStep === step;
    }
    return pathname === itemPath;
  };

  return (
    <>
      {/* Floating toggle button - mobile only */}
      <button
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg lg:hidden z-50"
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>

      {/* Quick Access Panel */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: open ? 0 : 100, opacity: open ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`
          fixed top-1/4 right-0 bg-white text-gray-800 border border-gray-200 rounded-l-xl shadow-md p-3 z-50 flex flex-col gap-2
          lg:flex lg:translate-x-0 lg:opacity-100
        `}
      >
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.label}
              onClick={() => handleNavigate(item)}
              className={`px-4 py-2 rounded-lg text-base font-medium transition ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "hover:bg-gray-100 text-black"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </motion.div>
    </>
  );
}
