"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Typography,
} from "@mui/material";
import { Timer as TimerIcon } from "@phosphor-icons/react/dist/ssr/Timer";
import { LOGIN_EVENT_TYPE_LABELS } from "@/lib/constants/LoginEventTypes";
import { createClient } from "@/lib/supabase/browser";
import { getCurrentContactId } from "@/lib/utils/getCurrentContactId";
import { dayjs } from "@/lib/dayjs";
import { DataTable } from "@/components/core/data-table";

const columns = [
  {
    formatter: (row) => {
      const label = LOGIN_EVENT_TYPE_LABELS[row.type] || row.type;
      return (
        <div>
          <Typography variant="subtitle2">{label}</Typography>
          <Typography color="text.secondary" variant="inherit">
            on {dayjs(row.created_at).format("hh:mm A MMM D, YYYY")}
          </Typography>
        </div>
      );
    },
    name: "Login type",
    width: "250px",
  },
  { field: "ip", name: "IP address", width: "150px" },
  { field: "user_agent", name: "User agent", width: "200px" },
];

export function LoginHistory() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchLoginEvents = async () => {
      setLoading(true);

      const contactId = await getCurrentContactId(supabase);
      if (!contactId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("login_events")
        .select("id, type, ip, user_agent, created_at")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching login events:", error);
      } else {
        setEvents(data);
      }

      setLoading(false);
    };

    fetchLoginEvents();
  }, []);

  return (
    <Card>
      <CardHeader
        avatar={
          <Avatar>
            <TimerIcon fontSize="var(--Icon-fontSize)" />
          </Avatar>
        }
        title="Login history"
      />
      <CardContent>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Card sx={{ overflowX: "auto" }} variant="outlined">
            <DataTable columns={columns} rows={events} />
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
