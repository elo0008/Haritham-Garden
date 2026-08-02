"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface UseRealtimeSubscriptionOptions<T extends Record<string, any>> {
  table: string;
  schema?: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
  filter?: string;
  enabled?: boolean;
  onInsert?: (newRecord: T) => void;
  onUpdate?: (newRecord: T, oldRecord: Partial<T>) => void;
  onDelete?: (oldRecord: Partial<T>) => void;
  onReconnect?: () => void;
}

export function useRealtimeSubscription<T extends Record<string, any>>({
  table,
  schema = "public",
  event = "*",
  filter,
  enabled = true,
  onInsert,
  onUpdate,
  onDelete,
  onReconnect,
}: UseRealtimeSubscriptionOptions<T>) {
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onInsertRef.current = onInsert;
    onUpdateRef.current = onUpdate;
    onDeleteRef.current = onDelete;
    onReconnectRef.current = onReconnect;
  }, [onInsert, onUpdate, onDelete, onReconnect]);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const channelName = `realtime_${table}_${Math.random().toString(36).substring(2, 7)}`;

    const channelConfig: any = {
      event,
      schema,
      table,
    };
    if (filter) {
      channelConfig.filter = filter;
    }

    let isReconnecting = false;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as any,
        channelConfig,
        (payload: RealtimePostgresChangesPayload<T>) => {
          if (payload.eventType === "INSERT") {
            onInsertRef.current?.(payload.new as T);
          } else if (payload.eventType === "UPDATE") {
            onUpdateRef.current?.(payload.new as T, payload.old as Partial<T>);
          } else if (payload.eventType === "DELETE") {
            onDeleteRef.current?.(payload.old as Partial<T>);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          if (isReconnecting) {
            isReconnecting = false;
            onReconnectRef.current?.();
          }
        } else if (status === "CHANNEL_ERROR" || status === "CLOSED") {
          isReconnecting = true;
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, schema, event, filter, enabled]);
}
