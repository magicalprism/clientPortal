"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";

import { createClient } from "@/lib/supabase/browser";
import { toast } from "@/components/core/toaster";
import { paths } from "@/paths";

export function OnboardingForm({ onboarding }) {
  console.log("🟢 OnboardingForm mounted with onboarding prop:", onboarding);

  const supabase = createClient();
  const router = useRouter();

  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [useClientMap, setUseClientMap] = useState({});
  const [sectionVisibilityMap, setSectionVisibilityMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");

  // Fetch Companies
  useEffect(() => {
    console.log("📥 useEffect: Fetching companies...");
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from("company")
        .select("id, title")
        .eq("is_client", true)
        .order("title");

      if (error) {
        console.error("❌ Error fetching companies:", error);
        toast.error("Could not load companies");
      } else {
        console.log("✅ Companies loaded:", data);
        setCompanies(data);
      }
    };

    fetchCompanies();
  }, []);

  // Fetch Projects
  useEffect(() => {
    console.log("📥 useEffect: Fetching projects for company ID:", selectedCompanyId);
    const fetchProjects = async () => {
      if (!selectedCompanyId) return;

      const { data, error } = await supabase
        .from("project")
        .select("id, title")
        .eq("company_id", selectedCompanyId)
        .order("title");

      if (error) {
        console.error("❌ Error fetching projects:", error);
        toast.error("Could not load projects");
      } else {
        console.log("✅ Projects loaded:", data);
        setProjects(data);
        if (!onboarding) setSelectedProjectId("");
      }
    };

    fetchProjects();
  }, [selectedCompanyId, onboarding?.id]);

  // Fetch Sections + Fields
  useEffect(() => {
    console.log("📥 useEffect: Fetching sections with fields...");
    const fetchSectionsWithFields = async () => {
      const { data, error } = await supabase
        .from("onboardingsection")
        .select(`
          id,
          title,
          field_onboardingsection (
            order,
            field (
              id,
              title
            )
          )
        `);

      if (error) {
        console.error("❌ Error fetching sections:", error);
        toast.error("Could not load sections");
        return;
      }

      console.log("✅ Sections fetched:", data);

      const formatted = data.map((section) => {
        const fields = section.field_onboardingsection
          ?.filter((item) => item?.field?.id)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((item) => item.field);

        return {
          id: section.id,
          title: section.title,
          fields,
        };
      });

      const sectionMap = {};
      const fieldMap = {};

      formatted.forEach((section) => {
        sectionMap[section.id] = true;
        section.fields.forEach((field) => {
          fieldMap[field.id] = false;
        });
      });

      console.log("🧠 Initial section map:", sectionMap);
      console.log("🧠 Initial field map:", fieldMap);

      setSections(formatted);
      setSectionVisibilityMap(sectionMap);
      setUseClientMap(fieldMap);
      setLoading(false);
    };

    fetchSectionsWithFields();
  }, []);

  // Prefill in edit mode
  useEffect(() => {
    if (!onboarding?.id) return;

    console.log("✍️ Prefilling from onboarding object:", onboarding);
    setSelectedCompanyId(onboarding.company_id);
    setSelectedProjectId(onboarding.project_id);

    const fetchFields = async () => {
      const { data, error } = await supabase
        .from("field_onboarding")
        .select("field_id")
        .eq("onboarding_id", onboarding.id);

      if (error) {
        console.error("❌ Error fetching field_onboarding:", error);
        return;
      }

      const newMap = {};
      data.forEach((f) => {
        newMap[f.field_id] = true;
      });

      console.log("🧠 useClientMap override from DB:", newMap);
      setUseClientMap((prev) => ({ ...prev, ...newMap }));
    };

    fetchFields();
  }, [onboarding?.id]);

  const handleCreateNewProject = async () => {
    console.log("🚧 Creating new project titled:", newProjectTitle);

    if (!newProjectTitle.trim()) {
      toast.error("Title required");
      return;
    }

    try {
      const created = new Date();

      const { data: project, error } = await supabase
        .from("project")
        .insert({
          title: newProjectTitle,
          company_id: selectedCompanyId,
          created: created.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      console.log("✅ Project created:", project);

      await supabase.from("company_project").insert({
        company_id: selectedCompanyId,
        project_id: project.id,
      });

      const { data: updatedProjects } = await supabase
        .from("project")
        .select("id, title")
        .eq("company_id", selectedCompanyId)
        .order("title");

      console.log("🔁 Updated projects:", updatedProjects);
      setProjects(updatedProjects);
      setSelectedProjectId(project.id);
      setNewProjectDialogOpen(false);
      setNewProjectTitle("");

      toast.success("Project created");
    } catch (err) {
      console.error("❌ Failed to create project:", err);
      toast.error("Failed to create project");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("📝 Submitting form...");
    console.log("Selected company:", selectedCompanyId);
    console.log("Selected project:", selectedProjectId);
    console.log("useClientMap:", useClientMap);

    if (!selectedCompanyId || !selectedProjectId) {
      toast.error("Select company and project");
      return;
    }

    const selectedFieldIds = Object.entries(useClientMap)
      .filter(([_, checked]) => checked)
      .map(([id]) => parseInt(id));

    console.log("📦 Selected field IDs:", selectedFieldIds);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData?.user?.id;
      console.log("👤 Supabase user ID:", userId);

      const { data: contactData, error: contactError } = await supabase
        .from("contact")
        .select("id")
        .eq("supabase_user_id", userId)
        .single();

      if (contactError) throw contactError;

      const authorId = contactData.id;
      const created = new Date();

      if (onboarding?.id) {
        console.log("🔄 Updating onboarding:", onboarding.id);

        const { error: updateError } = await supabase
          .from("onboarding")
          .update({
            company_id: selectedCompanyId,
            project_id: selectedProjectId,
            updated: created.toISOString(),
          })
          .eq("id", onboarding.id);

        if (updateError) {
          console.error("❌ Failed to update onboarding:", updateError);
          toast.error("Failed to update onboarding");
          return;
        }

        const { error: deleteError } = await supabase
          .from("field_onboarding")
          .delete()
          .eq("onboarding_id", onboarding.id);

        if (deleteError) {
          console.error("❌ Failed to clear existing fields:", deleteError);
        }

        if (selectedFieldIds.length) {
          const inserts = selectedFieldIds.map((fieldId) => ({
            onboarding_id: onboarding.id,
            field_id: fieldId,
            visible: true,
          }));

          const { error: insertError } = await supabase
            .from("field_onboarding")
            .insert(inserts);

          if (insertError) {
            console.error("❌ Failed to re-insert fields:", insertError);
          }
        }

        toast.success("Onboarding updated");
        router.push(paths.dashboard.onboarding.details(onboarding.id));
      } else {
        console.log("🆕 Creating new onboarding...");
        const company = companies.find((c) => c.id === selectedCompanyId);
        const project = projects.find((p) => p.id === selectedProjectId);

        const { data: existing } = await supabase
          .from("onboarding")
          .select("id")
          .eq("company_id", selectedCompanyId)
          .eq("project_id", selectedProjectId);

        const version = (existing?.length || 0) + 1;
        const title = `${company?.title} – ${project?.title} – v${version}`;

        const { data: newOnboarding, error: createError } = await supabase
          .from("onboarding")
          .insert({
            company_id: selectedCompanyId,
            project_id: selectedProjectId,
            author_id: authorId,
            title,
            created: created.toISOString(),
            status: "in_progress",
          })
          .select()
          .single();

        if (createError) {
          console.error("❌ Failed to create onboarding:", createError);
          toast.error("Failed to create onboarding");
          return;
        }

        if (selectedFieldIds.length) {
          const inserts = selectedFieldIds.map((fieldId) => ({
            onboarding_id: newOnboarding.id,
            field_id: fieldId,
            visible: true,
          }));

          const { error: insertError } = await supabase
            .from("field_onboarding")
            .insert(inserts);

          if (insertError) {
            console.error("❌ Failed to insert onboarding fields:", insertError);
          }
        }

        toast.success("Onboarding created");
        router.push(paths.dashboard.onboarding.details(newOnboarding.id));
      }
    } catch (err) {
      console.error("❌ Unexpected error during save:", err);
      toast.error("Something went wrong while saving");
    }
  };

  if (loading) {
    return <Typography sx={{ p: 3 }}>⏳ Loading onboarding...</Typography>;
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent>
            <Stack spacing={4} divider={<Divider />}>
              <Stack direction="row" spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Company</InputLabel>
                  <Select
                    value={selectedCompanyId || ""}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    label="Company"
                  >
                    {companies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth disabled={!selectedCompanyId}>
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={selectedProjectId || ""}
                    onChange={(e) =>
                      e.target.value === "add-new"
                        ? setNewProjectDialogOpen(true)
                        : setSelectedProjectId(e.target.value)
                    }
                    label="Project"
                  >
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.title}
                      </MenuItem>
                    ))}
                    <MenuItem value="add-new">➕ Add New Project</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {sections.map((section) => {
                const isVisible = sectionVisibilityMap[section.id];

                return (
                  <div key={section.id}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="h6">{section.title}</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={isVisible}
                            onChange={(e) =>
                              setSectionVisibilityMap((prev) => ({
                                ...prev,
                                [section.id]: e.target.checked,
                              }))
                            }
                          />
                        }
                        label={isVisible ? "Visible" : "Hidden"}
                      />
                    </Stack>

                    {isVisible && (
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        {section.fields.map((field) => (
                          <Grid item xs={12} sm={6} md={4} key={field.id}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={useClientMap[field.id] || false}
                                  onChange={(e) =>
                                    setUseClientMap((prev) => ({
                                      ...prev,
                                      [field.id]: e.target.checked,
                                    }))
                                  }
                                />
                              }
                              label={field.title}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </div>
                );
              })}
            </Stack>
          </CardContent>
          <CardActions sx={{ justifyContent: "flex-end" }}>
            <Button type="submit" variant="contained">
              {onboarding ? "Update Onboarding" : "Create Onboarding"}
            </Button>
          </CardActions>
        </Card>
      </form>

      <Dialog
        open={newProjectDialogOpen}
        onClose={() => setNewProjectDialogOpen(false)}
      >
        <DialogTitle>Add New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Project Title"
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewProjectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateNewProject} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
