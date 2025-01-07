import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface Role {
  id: string;
  name: string;
}

interface Props {
  sessionId: string;
  userId: string;
}

export default function RoleSelection({ sessionId, userId }: Props) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      const { data } = await supabase.from("roles").select("*").limit(2);

      if (data) {
        setRoles(data);
      }
    };

    fetchRoles();
  }, []);

  const handleRoleSelect = async (roleId: string) => {
    setSelectedRole(roleId);

    await supabase.from("rounds").insert([
      {
        session_id: sessionId,
        customer_id: userId,
        seller_id: userId, // This will be updated when the seller makes their choice
        selected_role_id: roleId,
      },
    ]);
  };

  return (
    <div className="py-6">
      <h3 className="text-xl font-semibold mb-4 text-center">
        Choose Your Role
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => handleRoleSelect(role.id)}
            disabled={selectedRole !== null}
            className={`p-4 rounded-lg border-2 ${
              selectedRole === role.id
                ? "border-purple-500"
                : "border-gray-200 hover:border-purple-300"
            }`}
          >
            <p className="text-lg font-medium">{role.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
