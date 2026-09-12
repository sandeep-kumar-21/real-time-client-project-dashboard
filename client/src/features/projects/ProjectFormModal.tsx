import React, { useState, useEffect } from "react";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { projectsApi } from "../../api/projects.api";
import { clientsApi } from "../../api/clients.api";
import type { Client } from "../../types/project";
import toast from "react-hot-toast";

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingClients(true);
      clientsApi
        .list()
        .then((data) => {
          setClients(data);
          if (data.length > 0 && !clientId) {
            setClientId(data[0].id);
          }
        })
        .catch((err) => {
          console.error("Failed to load clients:", err);
          toast.error("Failed to load clients list");
        })
        .finally(() => setIsLoadingClients(false));
    }
  }, [isOpen, clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientId) {
      toast.error("Project name and client are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await projectsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        clientId,
      });
      toast.success("Project created successfully");
      setName("");
      setDescription("");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name"
          placeholder="e.g. Enterprise Cloud Migration"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="High-level project objectives and deliverables..."
            rows={3}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
          />
        </div>

        <Select
          label="Associated Client"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
          disabled={isLoadingClients}
        >
          {clients.length === 0 ? (
            <option value="">{isLoadingClients ? "Loading clients..." : "No clients found"}</option>
          ) : (
            clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.company ? `(${c.company})` : ""}
              </option>
            ))
          )}
        </Select>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={clients.length === 0} className="w-full sm:w-auto">
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};

