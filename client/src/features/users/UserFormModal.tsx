import React, { useState, useEffect } from "react";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { usersApi, type ManagedUser } from "../../api/users.api";
import type { Role } from "../../types/auth";
import toast from "react-hot-toast";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: ManagedUser | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userToEdit,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("DEVELOPER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(userToEdit);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
      setPassword("");
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setRole("DEVELOPER");
    }
  }, [userToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    if (!isEditing && !password) {
      toast.error("Password is required for new users");
      return;
    }

    if (password && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && userToEdit) {
        await usersApi.update(userToEdit.id, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          ...(password ? { password } : {}),
        });
        toast.success("User updated successfully");
      } else {
        await usersApi.create({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        });
        toast.success("User created successfully");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to save user"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit User: ${userToEdit?.name}` : "Create New Team Member"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="e.g. Vikram Malhotra"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="e.g. vikram@enterprise.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label={isEditing ? "Password (leave blank to keep unchanged)" : "Password"}
          type="password"
          placeholder={isEditing ? "••••••••" : "Minimum 6 characters"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={!isEditing}
        />

        <Select
          label="System Role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          <option value="DEVELOPER">Developer (Assigned tasks only)</option>
          <option value="PROJECT_MANAGER">Project Manager (Own projects & tasks)</option>
          <option value="ADMIN">Administrator (Full global system access)</option>
        </Select>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full sm:w-auto">
            {isEditing ? "Save Changes" : "Create User"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
