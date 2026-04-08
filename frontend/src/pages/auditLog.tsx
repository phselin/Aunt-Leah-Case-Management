import axios from "axios";
import styled from "styled-components";
import api from "../api";
import { useEffect, useState } from "react";

/* ── Types ─────────────────────────────────────────────────────────── */
interface AuditEvent {
    id: string;
    timestamp: Date;
    action: string;
    user: string;
    details?: string;
}

/* ── Styled Components ─────────────────────────────────────────────── */

const EntryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const EntryCard = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
`;

const EntryMain = styled.div<{ $clickable?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
  user-select: none;

  &:hover {
    background: ${({ $clickable }) => ($clickable ? "#fafafa" : "transparent")};
  }
`;

const EntryText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ActionLabel = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  letter-spacing: -0.01em;
`;

const Timestamp = styled.span`
  font-size: 12.5px;
  color: #9ca3af;
`;

const ChevronBtn = styled.div<{ $expanded: boolean }>`
  font-size: 16px;
  color: #6b7280;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  flex-shrink: 0;
  transition: transform 0.2s, color 0.15s;
  transform: ${({ $expanded }) => ($expanded ? "rotate(90deg)" : "rotate(0deg)")};
`;

const DetailsArea = styled.div`
  border-top: 1px solid #f3f4f6;
  padding: 12px 18px 14px;
  background: #fafbfc;
  font-size: 13.5px;
  color: #374151;
  line-height: 1.6;
  white-space: pre-wrap;
`;

const ErrorBox = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px 14px;
  color: #dc2626;
  font-size: 13.5px;
  margin-bottom: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 20px;
  color: #9ca3af;
  font-size: 14px;
  line-height: 1.6;
`;

const PaginationRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
`;

const PageBtn = styled.button<{ $active?: boolean }>`
  min-width: 34px;
  height: 34px;
  padding: 0 10px;
  border-radius: 7px;
  border: 1px solid ${({ $active }) => ($active ? "#e94b6a" : "#e5e7eb")};
  background: ${({ $active }) => ($active ? "#e94b6a" : "#fff")};
  color: ${({ $active }) => ($active ? "#fff" : "#374151")};
  font-size: 13.5px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:hover:not(:disabled) {
    background: ${({ $active }) => ($active ? "#4f46e5" : "#f3f4f6")};
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

/* ── Helpers ────────────────────────────────────────────────────────── */

const formatTimestamp = (timestamp: Date): string => {
    const d = new Date(timestamp);
    return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

/* ── Component ─────────────────────────────────────────────────────── */

const AuditLog = () => {
    const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
    const [errMsg, setErrMsg] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    /* ── Fetch Audit Events ────────────────────────────────────────── */

    const loadAuditEvents = async (pageNum: number) => {
        try {
            const res = await api.get(`/audit`, { params: { page: pageNum } });
            const data: AuditEvent[] = Array.isArray(res.data) ? res.data : [];
            setAuditEvents(data);
            setHasMore(data.length === 20);
            setExpandedIds(new Set());
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                setErrMsg(err.response.data?.detail || "Failed to load audit events");
            } else {
                setErrMsg("Unable to connect to server");
            }
        }
    };

    useEffect(() => {
        loadAuditEvents(page);
    }, [page]);

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    /* ── Main render ───────────────────────────────────────────────── */

    return (
        <>
            {errMsg && <ErrorBox>{errMsg}</ErrorBox>}

            {auditEvents.length === 0 && !errMsg && (
                <EmptyState>No audit events to display.</EmptyState>
            )}

            <EntryList>
                {auditEvents.map((event) => {
                    const hasDetails = Boolean(event.details);
                    const isExpanded = expandedIds.has(event.id);

                    return (
                        <EntryCard key={event.id}>
                            <EntryMain
                                $clickable={hasDetails}
                                onClick={() => hasDetails && toggleExpand(event.id)}
                            >
                                <EntryText>
                                    <ActionLabel>
                                        {event.user} {event.action}
                                    </ActionLabel>
                                    <Timestamp>{formatTimestamp(event.timestamp)}</Timestamp>
                                </EntryText>

                                {hasDetails && (
                                    <ChevronBtn $expanded={isExpanded}>›</ChevronBtn>
                                )}
                            </EntryMain>

                            {hasDetails && isExpanded && (
                                <DetailsArea>{event.details}</DetailsArea>
                            )}
                        </EntryCard>
                    );
                })}
            </EntryList>

            <PaginationRow>
                <PageBtn onClick={() => setPage(1)} disabled={page === 1}>«</PageBtn>
                <PageBtn onClick={() => setPage((p) => p - 1)} disabled={page === 1}>‹</PageBtn>
                {page > 1 && (
                    <PageBtn onClick={() => setPage(page - 1)}>{page - 1}</PageBtn>
                )}
                <PageBtn $active>{page}</PageBtn>
                {hasMore && (
                    <PageBtn onClick={() => setPage(page + 1)}>{page + 1}</PageBtn>
                )}
                <PageBtn onClick={() => setPage((p) => p + 1)} disabled={!hasMore}>›</PageBtn>
            </PaginationRow>
            <div style={{height: "40px"}}/>
        </>
    );
};

export default AuditLog;