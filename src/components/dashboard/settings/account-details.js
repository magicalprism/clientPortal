"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import {
  Avatar, Box, Button, Card, CardActions, CardContent, CardHeader,
  FormControl, FormHelperText, InputAdornment, InputLabel,
  OutlinedInput, Select, Stack, Typography, Link
} from "@mui/material";
import { Camera as CameraIcon } from "@phosphor-icons/react/dist/ssr/Camera";
import { User as UserIcon } from "@phosphor-icons/react/dist/ssr/User";
import { getCurrentContactId } from "@/lib/utils/getCurrentContactId";
import RichTextFieldRenderer from "@/components/fields/text/richText/RichTextFieldRenderer";
import { TimezoneSelect } from "@/components/fields/dateTime/timezone/TimezoneSelect";

export function AccountDetails() {
  const supabase = createClient();
  const [contact, setContact] = useState(null);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContact = async () => {
      const contactId = await getCurrentContactId();
      if (!contactId) return;

      const { data, error } = await supabase
        .from("contact")
        .select("*, media:thumbnail_id(url)")
        .eq("id", contactId)
        .single();

      if (error) {
        console.error("Error fetching contact", error);
      } else {
        setContact(data);
        setOriginal(data); // for cancel
      }

      setLoading(false);
    };

    fetchContact();
  }, []);

  const handleChange = (field) => (e) => {
    setContact({ ...contact, [field]: e.target.value });
  };

  const handleSave = async () => {
    const { data, error } = await supabase
      .from("contact")
      .update(contact)
      .eq("id", contact.id);

    if (error) {
      alert("Failed to save.");
      console.error(error);
    } else {
      alert("Changes saved!");
      setOriginal(contact);
    }
  };

  const handleCancel = () => {
    setContact(original);
  };

  if (loading || !contact) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader
        avatar={<Avatar><UserIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
        title="Basic details"
      />
      <CardContent>
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                border: "1px dashed var(--mui-palette-divider)",
                borderRadius: "50%",
                display: "inline-flex",
                p: "4px",
              }}
            >
              <Box sx={{ borderRadius: "inherit", position: "relative" }}>
                <Box
                  sx={{
                    alignItems: "center",
                    bgcolor: "rgba(0, 0, 0, 0.5)",
                    borderRadius: "inherit",
                    bottom: 0,
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                    left: 0,
                    opacity: 0,
                    position: "absolute",
                    right: 0,
                    top: 0,
                    zIndex: 1,
                    "&:hover": { opacity: 1 },
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <CameraIcon fontSize="var(--icon-fontSize-md)" />
                    <Typography color="inherit" variant="subtitle2">Select</Typography>
                  </Stack>
                </Box>
                <Avatar
                  src={contact.media?.url || "/assets/avatar.png"}
                  sx={{ "--Avatar-size": "100px" }}
                />
              </Box>
            </Box>
            <Button color="secondary" size="small">Remove</Button>
          </Stack>
          <Stack spacing={2}>
            <FormControl>
              <InputLabel>First name</InputLabel>
              <OutlinedInput value={contact.first_name || ""} onChange={handleChange("first_name")} />
            </FormControl>
            <FormControl>
              <InputLabel>Last name</InputLabel>
              <OutlinedInput value={contact.last_name || ""} onChange={handleChange("last_name")} />
            </FormControl>
            <FormControl disabled>
              <InputLabel>Email address</InputLabel>
              <OutlinedInput value={contact.email} type="email" />
              <FormHelperText>
                Please <Link variant="inherit">contact us</Link> to change your email
              </FormHelperText>
            </FormControl>
            <FormControl>
              <InputLabel>Phone number</InputLabel>
              <OutlinedInput value={contact.tel || ""} onChange={handleChange("tel")} />
            </FormControl>
            <FormControl>
              <InputLabel>Title</InputLabel>
              <OutlinedInput value={contact.title || ""} onChange={handleChange("title")} />
            </FormControl>
            <Stack spacing={1}>
				<Typography variant="subtitle2">Biography</Typography>
				  <RichTextFieldRenderer
					value={contact.bio || ""}
					editable={true}
					mode="edit"
					onChange={(html) => setContact({ ...contact, bio: html })}
					field={{ name: "bio" }}
  />
			</Stack>
			<FormControl>
				<InputLabel shrink>Time Zone</InputLabel>
				<TimezoneSelect
					name="site_timezone"
					value={contact.site_timezone || ""}
					onChange={(tz) => setContact({ ...contact, site_timezone: tz })}
				/>
				</FormControl>
          </Stack>
        </Stack>
      </CardContent>
      <CardActions sx={{ justifyContent: "flex-end" }}>
        <Button color="secondary" onClick={handleCancel}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save changes</Button>
      </CardActions>
    </Card>
  );
}
