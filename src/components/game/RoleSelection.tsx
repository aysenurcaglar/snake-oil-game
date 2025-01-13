import { useEffect } from "react";
import { useRoundsStore } from "../../store/roundsStore";

interface Props {
  sessionId: string;
  userId: string;
}

export default function RoleSelection({ sessionId, userId }: Props) {
  const { roles, selectedRole, fetchRoles, selectRole, error } =
    useRoundsStore();

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleRoleSelect = (roleId: string) => {
    selectRole(roleId, userId, sessionId);
  };

  return (
    <div className="py-6">
      <h3 className="text-xl font-semibold mb-4 text-center">
        Choose Your Role
      </h3>

      {error && <p className="text-red-500 text-center">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => handleRoleSelect(role.id)}
            disabled={selectedRole !== null}
            className={`p-4 rounded-lg border-2 transition-colors duration-200 ${
              selectedRole === role.id
                ? "border-primary"
                : "border-gray-200 hover:border-primary"
            }`}
          >
            <p className="text-lg font-medium">{role.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
