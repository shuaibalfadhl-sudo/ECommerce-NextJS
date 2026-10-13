"use client";

import { useEffect, useMemo, useState } from "react";
import Toast from "@/components/ui/Toast";
import styles from "../hero-slides/page.module.css";

type User = {
  id: string;
  email: string;
  role: string | null;
  fullName: string;
  createdAt: string;
  lastSignInAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const pageSize = 8;

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await fetch("/api/admin/users");
        const result = await response.json() as { users?: User[]; error?: string };
        if (!response.ok) setToast({ message: result.error ?? "Unable to load registered users.", type: "error" });
        else setUsers(result.users ?? []);
      } catch (error) {
        setToast({ message: error instanceof Error ? error.message : "Unable to load registered users.", type: "error" });
      }
      setIsLoading(false);
    }

    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !query || user.email.toLowerCase().includes(query) || user.fullName.toLowerCase().includes(query);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const visibleUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const roles = Array.from(new Set(users.map((user) => user.role).filter((role): role is string => Boolean(role)))).sort();

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <section className={styles.page}>
        <div className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>ACCOUNT MANAGEMENT</p>
            <h2>Users</h2>
            <p className={styles.description}>View all users registered in your storefront.</p>
          </div>
          <div className={styles.introActions}><span className={styles.tableBadge}>users</span></div>
        </div>
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div><h3>Registered users</h3><p>{users.length} user{users.length === 1 ? "" : "s"} registered</p></div>
            <div className={styles.tableControls}>
              <label className={styles.searchField}><span>⌕</span><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search users" aria-label="Search users" /></label>
              <select value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setCurrentPage(1); }} aria-label="Filter users by role">
                <option value="all">All roles</option>
                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Registered</th><th>Last sign in</th><th>Role</th></tr></thead>
              <tbody>
                {isLoading ? <tr><td className={styles.tableState} colSpan={5}>Loading users...</td></tr> : filteredUsers.length === 0 ? <tr><td className={styles.tableState} colSpan={5}>{users.length === 0 ? "No registered users found." : "No users match the search."}</td></tr> : visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.fullName || "Unnamed user"}</strong></td>
                    <td>{user.email || "No email"}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{formatDate(user.lastSignInAt)}</td>
                    <td>{user.role ? <span className={styles.activeStatus}>{user.role}</span> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.pagination}><span>Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length}</span><div><button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Previous</button><strong>Page {currentPage} of {totalPages}</strong><button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next</button></div></div>
        </div>
      </section>
    </>
  );
}
