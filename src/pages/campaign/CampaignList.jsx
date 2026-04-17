import { useEffect, useState, useCallback } from "react";
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignCodes,
} from "../../api/campaignApi";
import toast from "react-hot-toast";
import { getUsers } from "../../api/userApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import CampaignToolbar from "../../components/features/campaign/CampaignToolbar";
import CampaignTable from "../../components/features/campaign/CampaignTable";
import CampaignPagination from "../../components/features/campaign/CampaignPagination";
import CampaignFormModal from "../../components/features/campaign/CampaignFormModal";
import DeleteConfirmModal from "../../components/features/campaign/DeleteConfirmModal";
import ViewCampaignModal from "../../components/features/campaign/ViewCampaignModal";

const EMPTY_FORM = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  state: "",
  walls: "",
  assignedUsers: [],
};

export default function CampaignList() {
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  // Toolbar state
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  // Form
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchUsers();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await getCampaigns();
      if (res.Status) {
        const formatted = res.Data.map((c, i) => ({
          id: c.ID,
          srNo: i + 1,
          name: c.Name,
          description: c.Description,
          state: c.State,
          walls: c.Number_of_Walls,
          startDate: c.Start_Date,
          endDate: c.End_Date,
          assignedUsers: c.Assigned_Users || [],
        }));
        setAllCampaigns(formatted);
      }
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      if (res.Status) {
        const valid = res.Data.filter((u) => u.Role === "Client");
        setUsers(
          valid.map((u) => ({
            value: u.Username,
            label: `${u.Username} (${u.Role})`,
          })),
        );
      }
    } catch {
      /* silent */
    }
  };

  // Filter + sort + paginate
  useEffect(() => {
    let data = [...allCampaigns];

    if (search) {
      const q = search.toLowerCase();
      data = data.filter((c) => {
        const assignedStr = (c.assignedUsers || []).join(" ").toLowerCase();
        return [c.name, c.state, c.description, assignedStr]
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
    }

    if (dateFrom) data = data.filter((c) => c.startDate >= dateFrom);
    if (dateTo) data = data.filter((c) => c.endDate <= dateTo);

    if (sortField) {
      data.sort((a, b) => {
        const av = a[sortField] ?? "";
        const bv = b[sortField] ?? "";
        if (av < bv) return sortOrder === "asc" ? -1 : 1;
        if (av > bv) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    const start = (page - 1) * limit;
    const paginated = data
      .slice(start, start + limit)
      .map((c, i) => ({ ...c, srNo: start + i + 1 }));
    setCampaigns(paginated);
  }, [
    allCampaigns,
    search,
    dateFrom,
    dateTo,
    page,
    limit,
    sortField,
    sortOrder,
  ]);

  const handleSort = (field) => {
    if (sortField === field)
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setShowCreateModal(true);
  };
  const openEdit = (c) => {
    setForm({
      name: c.name,
      description: c.description,
      startDate: c.startDate,
      endDate: c.endDate,
      state: c.state,
      walls: c.walls,
      assignedUsers: c.assignedUsers || [],
    });
    setEditTarget(c);
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createCampaign(form);
      if (res.Status) {
        toast.success("Campaign created!");
        setShowCreateModal(false);
        setForm(EMPTY_FORM);
        fetchCampaigns();
      } else toast.error(res.Message || "Failed to create");
    } catch {
      toast.error("Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await updateCampaign({ id: editTarget.id, ...form });
      if (res.Status) {
        toast.success("Campaign updated!");
        setEditTarget(null);
        fetchCampaigns();
      } else toast.error(res.Message || "Failed to update");
    } catch {
      console.log("Update Error:", err.response?.data || err);
      toast.error("Failed to update campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deleteCampaign(deleteTarget.id);
      if (res.Status) {
        toast.success("Campaign deleted");
        setDeleteTarget(null);
        fetchCampaigns();
      } else toast.error(res.Message || "Failed to delete");
    } catch {
      toast.error("Failed to delete campaign");
    }
  };

  const exportAllToExcel = () => {
    const data = allCampaigns.map((c) => ({
      Name: c.name,
      State: c.state,
      Walls: c.walls,
      "Start Date": c.startDate,
      "End Date": c.endDate,
      "Assigned Users": (c.assignedUsers || []).join(", "),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Campaigns");
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })]),
      "Campaigns.xlsx",
    );
  };

  const exportCampaignCodes = async (campaign) => {
    try {
      const res = await getCampaignCodes(campaign.id);

      if (res.Status && res.Codes) {
        const data = res.Codes.map((code, i) => ({
          SrNo: i + 1,
          Code: code,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(wb, ws, "Codes");

        saveAs(
          new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })]),
          `${campaign.name}_Codes.xlsx`,
        );

        toast.success("Codes exported!");
      } else {
        toast.error("No codes found for this campaign");
      }
    } catch {
      toast.error("Failed to fetch campaign codes");
    }
  };

  const totalFiltered = (() => {
    let data = [...allCampaigns];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((c) => {
        const assignedStr = (c.assignedUsers || []).join(" ").toLowerCase();
        return [c.name, c.state, c.description, assignedStr]
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
    }
    if (dateFrom) data = data.filter((c) => c.startDate >= dateFrom);
    if (dateTo) data = data.filter((c) => c.endDate <= dateTo);
    return data.length;
  })();

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--color-bg)",
        color: "var(--color-text-primary)",
      }}
    >
      <div className="max-w-full px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-secondary">
            Campaign Management
          </h2>
          <p className="text-text-secondary text-sm mt-1 font-body">
            View and manage all campaigns across Admin & Client users.
          </p>
        </div>

        <CampaignToolbar
          search={search}
          setSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          dateFrom={dateFrom}
          setDateFrom={(v) => {
            setDateFrom(v);
            setPage(1);
          }}
          dateTo={dateTo}
          setDateTo={(v) => {
            setDateTo(v);
            setPage(1);
          }}
          limit={limit}
          setLimit={(v) => {
            setLimit(v);
            setPage(1);
          }}
          onRefresh={fetchCampaigns}
          onCreateClick={openCreate}
          onExportAll={exportAllToExcel}
          loading={loading}
        />

        <CampaignTable
          campaigns={campaigns}
          loading={loading}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          onView={setViewTarget}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          onExportCodes={exportCampaignCodes}
        />

        <CampaignPagination
          page={page}
          limit={limit}
          total={totalFiltered}
          onPrev={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CampaignFormModal
          mode="create"
          form={form}
          setForm={setForm}
          users={users}
          submitting={submitting}
          onSubmit={handleSubmitCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editTarget && (
        <CampaignFormModal
          mode="edit"
          form={form}
          setForm={setForm}
          users={users}
          submitting={submitting}
          onSubmit={handleSubmitEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          campaign={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {viewTarget && (
        <ViewCampaignModal
          campaign={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={() => {
            setViewTarget(null);
            openEdit(viewTarget);
          }}
        />
      )}
    </div>
  );
}
