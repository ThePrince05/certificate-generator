"use client";

import { useRouter } from "next/navigation";
import { useOrganization } from "../context/OrganizationContext";

interface Organization {
  id: string;
  name: string;
  logoUrl: string;
  templateUrl: string;
}

const organizations: Organization[] = [
  {
    id: "pak",
    name: "Planned Acts of Kindness",
    logoUrl: "/images/planned-acts-of-kindness/logo.png",
    templateUrl: "/templates/planned-acts-of-kindness/certificate-template.jpg",
  },
  {
    id: "opop",
    name: "One Planet One People",
    logoUrl: "/images/one-planet-one-people/logo.png",
    templateUrl: "/templates/one-planet-one-people/certificate-template.jpg",
  },
];

export default function SelectOrganizationPage() {
  const { selectOrg } = useOrganization();
  const router = useRouter();

  const handleSelect = (org: Organization) => {
    selectOrg(org);
    router.push("/"); // go to certificate generator
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-16">
      <div className="max-w-4xl mx-auto text-center">
        {/* 🔹 Top title */}
        <h1 className="text-4xl font-extrabold mb-2">
          Custom Certificate Program
        </h1>

        {/* 🔹 Subtitle */}
        <p className="text-gray-600 text-lg mb-10">
          Select an organization to begin generating certificates.
        </p>

        {/* Organization grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {organizations.map((org) => (
            <div
              key={org.id}
              onClick={() => handleSelect(org)}
              className="cursor-pointer bg-white border rounded-lg shadow-md p-6 text-center hover:shadow-lg transition"
            >
              <img
                src={org.logoUrl}
                alt={org.name}
                className="w-32 h-32 mx-auto object-contain mb-4"
              />
              <h2 className="text-xl font-semibold">{org.name}</h2>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
