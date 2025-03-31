"use client"

import React, { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import Divider from "@mui/material/Divider"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { Plus as PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus"

import { createClient } from "@/lib/supabase/browser"
import { dayjs } from "@/lib/dayjs"

import { OnboardingFilters } from "@/components/dashboard/onboarding/onboarding-filters"
import { OnboardingTable } from "@/components/dashboard/onboarding/onboarding-table"

export default function OnboardingArchive() {
  const searchParams = useSearchParams()

  const rawTitle = searchParams.get("title")
const rawProject = searchParams.get("project_id")
const rawSortDir = searchParams.get("sortDir")

const title = rawTitle || ""
const project = rawProject || ""
const sortDir = rawSortDir || "desc"

  

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("onboarding")
        .select("*")

      if (error) {
        console.error("Error loading onboarding entries:", error.message)
        setRows([])
        return
      }

      const enriched = (data || []).map((entry) => ({
        id: entry.id,
        title: entry.title || "",
        project_id: entry.project_id || "",
        createdAt: dayjs(entry.created_at).toDate(),
        status: entry.onboarding.status || "Approved"
      }))

      const sorted = applySort(enriched, sortDir)
      const filtered = applyFilters(sorted, { title, project })

      setRows(filtered)
      setLoading(false)
    }

    fetchData()
  }, [title, project, sortDir])

  return (
    <Box
      sx={{
        maxWidth: "var(--Content-maxWidth)",
        m: "var(--Content-margin)",
        p: "var(--Content-padding)",
        width: "var(--Content-width)",
      }}
    >
      <Stack spacing={4}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          sx={{ alignItems: "flex-start" }}
        >
          <Box sx={{ flex: "1 1 auto" }}>
            <Typography variant="h4">Onboarding Forms</Typography>
          </Box>
          <Box>
            <Button
              component={Link}
              href="/dashboard/onboarding/create"
              startIcon={<PlusIcon />}
              variant="contained"
            >
              New Entry
            </Button>
          </Box>
        </Stack>

        <Card>
          <OnboardingFilters
            filters={{ title, project }}
            sortDir={sortDir}
          />
          <Divider />
          <Box sx={{ overflowX: "auto" }}>
            <OnboardingTable rows={rows} />
          </Box>
          <Divider />
        </Card>
      </Stack>
    </Box>
  )
}

function applySort(rows, sortDir) {
  return rows.sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0
    return sortDir === "asc"
      ? a.createdAt.getTime() - b.createdAt.getTime()
      : b.createdAt.getTime() - a.createdAt.getTime()
  })
}

function applyFilters(rows, { title, project }) {
  return rows.filter((item) => {
    if (title && !item.title.toLowerCase().includes(title.toLowerCase())) return false
    if (project && !item.project_id?.toLowerCase().includes(project.toLowerCase())) return false
    return true
  })
}
