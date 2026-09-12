import React, { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { clientsApi } from "../../api/clients.api";
import toast from "react-hot-toast";

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Client name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await clientsApi.create({
        name: name.trim(),
        email: email.trim() || undefined,
        company: company.trim() || undefined,
      });
      toast.success("Client registered successfully");
      setName("");
      setEmail("");
      setCompany("");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create client");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Client Account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Client / Contact Name"
          placeholder="e.g. Acme Corp Contact"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="contact@acme.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Company / Organization"
          placeholder="Acme International Ltd."
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full sm:w-auto">
            Create Client
          </Button>
        </div>
      </form>
    </Modal>
  );
};

