import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  X,
  ShieldCheck,
  Crown,
  UserCheck,
  UserX,
  Clock,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import type { AdminMemberRecord } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
}) => {
  const [members, setMembers] = useState<AdminMemberRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTier, setFilterTier] = useState<'all' | 'pending' | 'pro' | 'free'>('all');
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const getAdminToken = () =>
    sessionStorage.getItem('imglink_admin_token') || '';

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getAdminToken();
      const res = await axios.get<{ members: AdminMemberRecord[] }>('/api/auth', {
        params: { action: 'admin-members', adminToken: token },
        headers: {
          'x-admin-token': token,
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (Array.isArray(res.data.members)) {
        setMembers(res.data.members);
      }
    } catch (err: unknown) {
      console.error('Failed to load admin members:', err);
      let errorMsg = 'FAILED TO LOAD MEMBERS. ADMIN ACCESS REQUIRED.';
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        errorMsg = err.response.data.error.toUpperCase();
      }
      setNotice({
        message: errorMsg,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, fetchMembers]);

  if (!isOpen) return null;

  const handleProDecision = async (
    targetUserId: string,
    decision: 'approve' | 'reject' | 'set-tier',
    tier?: 'free' | 'pro'
  ) => {
    setActionLoadingId(targetUserId);
    setNotice(null);
    try {
      const token = getAdminToken();
      await axios.post(
        '/api/auth',
        {
          action: 'admin-pro-action',
          adminToken: token,
          targetUserId,
          decision,
          tier,
        },
        {
          params: { adminToken: token },
          headers: {
            'x-admin-token': token,
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        }
      );

      setNotice({
        message:
          decision === 'approve'
            ? 'PRO STATUS APPROVED!'
            : decision === 'reject'
            ? 'REQUEST REJECTED.'
            : `TIER SET TO ${tier?.toUpperCase()}!`,
        type: 'success',
      });

      await fetchMembers();
    } catch (err: unknown) {
      let detail = 'ACTION FAILED';
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        detail = err.response.data.error.toUpperCase();
      }
      setNotice({ message: detail, type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingRequests = members.filter((m) => m.proRequestStatus === 'pending');
  const totalPro = members.filter((m) => m.tier === 'pro' || m.role === 'admin').length;
  const totalFree = members.filter((m) => m.tier === 'free' && m.role !== 'admin').length;

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    const isMemberPro = m.tier === 'pro' || m.role === 'admin';
    if (filterTier === 'pending') return m.proRequestStatus === 'pending';
    if (filterTier === 'pro') return isMemberPro;
    if (filterTier === 'free') return !isMemberPro;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white border-[4px] border-black shadow-brutal-2xl w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden">
        {/* Modal Top Bar */}
        <div className="bg-neo-yellow border-b-[4px] border-black px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-neo-pink text-black border-[3px] border-black flex items-center justify-center shadow-brutal-sm -rotate-2">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                Member Management
                <span className="text-[10px] sm:text-xs font-mono font-black bg-black text-neo-yellow px-2 py-0.5 border border-black">
                  ADMIN ONLY
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs font-mono font-bold text-black/75">
                Manage accounts, quotas, and review Pro upgrade requests
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMembers}
              disabled={isLoading}
              className="p-1.5 sm:p-2 bg-neo-cyan hover:bg-neo-cyan/80 border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
              title="Refresh member list"
            >
              <RefreshCw className={`w-4 h-4 text-black ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 bg-neo-pink hover:bg-neo-red hover:text-white border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {notice && (
          <div
            className={`px-4 py-2.5 border-b-[3px] border-black font-mono font-black text-xs uppercase flex items-center justify-between ${
              notice.type === 'success' ? 'bg-neo-lime text-black' : 'bg-neo-pink text-black'
            }`}
          >
            <div className="flex items-center gap-2">
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              ) : (
                <AlertCircle className="w-4 h-4 stroke-[3]" />
              )}
              <span>{notice.message}</span>
            </div>
            <button onClick={() => setNotice(null)} className="font-bold underline text-xs">
              DISMISS
            </button>
          </div>
        )}

        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-neo-bg">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 font-mono">
            <div className="bg-white border-[3px] border-black p-3 shadow-brutal-sm">
              <span className="text-[10px] font-black uppercase text-black/70 block">
                Total Members
              </span>
              <span className="text-xl sm:text-2xl font-black text-black">{members.length}</span>
            </div>

            <div
              className={`border-[3px] border-black p-3 shadow-brutal-sm ${
                pendingRequests.length > 0 ? 'bg-neo-orange animate-pulse' : 'bg-white'
              }`}
            >
              <span className="text-[10px] font-black uppercase text-black/70 block">
                Pending Requests
              </span>
              <span className="text-xl sm:text-2xl font-black text-black">
                {pendingRequests.length}
              </span>
            </div>

            <div className="bg-neo-yellow/30 border-[3px] border-black p-3 shadow-brutal-sm">
              <span className="text-[10px] font-black uppercase text-black/70 block">
                Pro Members (Unlimited)
              </span>
              <span className="text-xl sm:text-2xl font-black text-black">{totalPro}</span>
            </div>

            <div className="bg-neo-cyan/20 border-[3px] border-black p-3 shadow-brutal-sm">
              <span className="text-[10px] font-black uppercase text-black/70 block">
                Free Members (Max 3)
              </span>
              <span className="text-xl sm:text-2xl font-black text-black">{totalFree}</span>
            </div>
          </div>

          {/* Pending Pro Requests Action Queue */}
          {pendingRequests.length > 0 && (
            <div className="bg-neo-yellow border-[3px] border-black p-4 shadow-brutal">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-5 h-5 text-black stroke-[3]" />
                <h3 className="font-black text-sm sm:text-base uppercase tracking-tight text-black">
                  Pending Pro Upgrade Requests ({pendingRequests.length})
                </h3>
              </div>

              <div className="space-y-3">
                {pendingRequests.map((reqUser) => (
                  <div
                    key={reqUser.id}
                    className="bg-white border-2 border-black p-3 sm:p-4 shadow-brutal-sm flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm uppercase text-black">
                          {reqUser.name}
                        </span>
                        <span className="text-xs font-mono font-bold text-black/70">
                          ({reqUser.email})
                        </span>
                        <span className="text-[10px] font-mono font-black bg-neo-cyan px-2 py-0.5 border border-black">
                          {reqUser.imageCount}/3 Images
                        </span>
                      </div>
                      {reqUser.proRequestNote && (
                        <p className="text-xs font-mono bg-neo-bg border border-black/40 px-2.5 py-1 text-black">
                          "{reqUser.proRequestNote}"
                        </p>
                      )}
                      {reqUser.proRequestedAt && (
                        <span className="text-[10px] font-mono text-black/60 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Requested: {new Date(reqUser.proRequestedAt).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleProDecision(reqUser.id, 'approve')}
                        disabled={actionLoadingId === reqUser.id}
                        className="px-3 py-1.5 bg-neo-lime hover:bg-neo-lime/80 active:translate-x-0.5 active:translate-y-0.5 border-2 border-black font-black uppercase text-xs text-black shadow-brutal-sm flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Approve Pro</span>
                      </button>
                      <button
                        onClick={() => handleProDecision(reqUser.id, 'reject')}
                        disabled={actionLoadingId === reqUser.id}
                        className="px-3 py-1.5 bg-neo-pink hover:bg-neo-red hover:text-white active:translate-x-0.5 active:translate-y-0.5 border-2 border-black font-black uppercase text-xs text-black shadow-brutal-sm flex items-center gap-1.5"
                      >
                        <UserX className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members List Control & Search */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/60" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border-2 border-black font-mono text-xs text-black focus:outline-none focus:shadow-brutal-sm"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 font-mono text-xs font-black flex-wrap">
                {(['all', 'pending', 'pro', 'free'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterTier(tab)}
                    className={`px-3 py-1.5 border-2 border-black uppercase shadow-brutal-sm transition-all ${
                      filterTier === tab
                        ? 'bg-black text-white -translate-y-0.5'
                        : 'bg-white text-black hover:bg-neo-yellow'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Members Table */}
            <div className="border-[3px] border-black bg-white shadow-brutal overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-neo-yellow border-b-2 border-black text-black uppercase font-black">
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Tier</th>
                    <th className="p-3">Images</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-black/60 font-black uppercase">
                        No members found matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m) => {
                      const isSelf = m.email.toLowerCase() === currentUserEmail.toLowerCase();
                      const isRootAdmin = m.role === 'admin';
                      const isMemberPro = m.tier === 'pro' || isRootAdmin;

                      return (
                        <tr key={m.id} className="hover:bg-neo-yellow/10 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 bg-neo-cyan text-black border-2 border-black flex items-center justify-center font-black text-xs flex-shrink-0 overflow-hidden">
                                {m.avatarUrl ? (
                                  <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                                ) : (
                                  m.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="font-black text-black uppercase block truncate max-w-[140px] sm:max-w-[200px]">
                                  {m.name}
                                </span>
                                <span className="text-[11px] text-black/60 block truncate max-w-[140px] sm:max-w-[200px]">
                                  {m.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            {m.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neo-pink text-black border border-black font-black text-[10px] uppercase shadow-brutal-sm">
                                ADMIN
                              </span>
                            ) : (
                              <span className="text-black/70 uppercase">USER</span>
                            )}
                          </td>

                          <td className="p-3">
                            {isMemberPro ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-neo-lime text-black border border-black font-black text-[10px] uppercase shadow-brutal-sm">
                                <Crown className="w-3 h-3 stroke-[3]" />
                                PRO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-black border border-black font-black text-[10px] uppercase">
                                FREE
                              </span>
                            )}
                          </td>

                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 font-black">
                              <ImageIcon className="w-3 h-3" />
                              {m.imageCount}
                              {!isMemberPro && <span className="text-black/50">/3</span>}
                            </span>
                          </td>

                          <td className="p-3">
                            {isRootAdmin ? (
                              <span className="text-green-700 font-bold uppercase text-[10px]">
                                AUTO PRO
                              </span>
                            ) : m.proRequestStatus === 'pending' ? (
                              <span className="px-2 py-0.5 bg-neo-orange text-black border border-black font-black text-[10px] uppercase animate-pulse">
                                PENDING
                              </span>
                            ) : m.proRequestStatus === 'approved' ? (
                              <span className="text-green-700 font-bold uppercase text-[10px]">
                                APPROVED
                              </span>
                            ) : m.proRequestStatus === 'rejected' ? (
                              <span className="text-red-600 font-bold uppercase text-[10px]">
                                REJECTED
                              </span>
                            ) : (
                              <span className="text-black/40 text-[10px]">—</span>
                            )}
                          </td>

                          <td className="p-3 text-right">
                            {isRootAdmin ? (
                              <span className="text-[10px] font-bold text-black/50 uppercase">
                                ROOT ADMIN
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                {m.tier === 'free' ? (
                                  <button
                                    onClick={() => handleProDecision(m.id, 'set-tier', 'pro')}
                                    disabled={actionLoadingId === m.id}
                                    className="px-2 py-1 bg-neo-lime hover:bg-neo-lime/80 border border-black font-black uppercase text-[10px] text-black shadow-brutal-sm"
                                  >
                                    Make Pro
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleProDecision(m.id, 'set-tier', 'free')}
                                    disabled={actionLoadingId === m.id}
                                    className="px-2 py-1 bg-white hover:bg-neo-pink border border-black font-black uppercase text-[10px] text-black shadow-brutal-sm"
                                  >
                                    Revoke Pro
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
