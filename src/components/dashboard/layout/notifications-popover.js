"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";
import CircularProgress from "@mui/material/CircularProgress";
import { ChatText as ChatTextIcon } from "@phosphor-icons/react/dist/ssr/ChatText";
import { EnvelopeSimple as EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr/EnvelopeSimple";
import { User as UserIcon } from "@phosphor-icons/react/dist/ssr/User";
import { X as XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { File as FileIcon } from "@phosphor-icons/react/dist/ssr/File";

import { dayjs } from "@/lib/dayjs";
import { createClient } from "@/lib/supabase/browser";
import { paths } from "@/paths";

// No static notifications - only showing real media notifications

export function NotificationsPopover({ anchorEl, onClose, onMarkAllAsRead, onRemoveOne, open = false }) {
	const [notifications, setNotifications] = React.useState([]);
	const [loading, setLoading] = React.useState(false);
	const [clearingAll, setClearingAll] = React.useState(false);

	// Handle individual notification dismissal
	const handleDismissNotification = React.useCallback((notificationId) => {
		try {
			// For media notifications, store in localStorage to remember dismissal
			if (notificationId.startsWith('media-')) {
				// Get existing dismissed notifications
				const dismissedNotificationsStr = localStorage.getItem('dismissedMediaNotifications') || '[]';
				const dismissedNotifications = JSON.parse(dismissedNotificationsStr);
				
				// Add this notification ID to the list
				if (!dismissedNotifications.includes(notificationId)) {
					dismissedNotifications.push(notificationId);
					
					// Store back in localStorage
					localStorage.setItem('dismissedMediaNotifications', JSON.stringify(dismissedNotifications));
					
					// Dispatch event to update badge count
					window.dispatchEvent(new CustomEvent(NOTIFICATION_DISMISSED_EVENT));
				}
			}
			
			// Remove from UI
			setNotifications(prev => prev.filter(n => n.id !== notificationId));
		} catch (err) {
			console.error('Error dismissing notification:', err);
		}
	}, []);

	// Fetch unsorted media items
	const fetchUnsortedMedia = React.useCallback(async () => {
		try {
			setLoading(true);
			const supabase = createClient();
			
			const { data, error } = await supabase
				.from('media')
				.select('id, title, source_email, created_at, url')
				.in('status', ['unsorted', 'pending'])
				.neq('is_deleted', true)
				.order('created_at', { ascending: false });
				
			if (error) {
				console.error('Error fetching unsorted media:', error);
				return;
			}
			
			// Get dismissed notifications from localStorage
			let dismissedNotifications = [];
			try {
				const dismissedNotificationsStr = localStorage.getItem('dismissedMediaNotifications') || '[]';
				dismissedNotifications = JSON.parse(dismissedNotificationsStr);
			} catch (e) {
				console.error('Error parsing dismissed notifications:', e);
			}
			
			// Convert to notification format and filter out dismissed ones
			const mediaNotifications = data
				.map(item => ({
					id: `media-${item.id}`,
					createdAt: new Date(item.created_at),
					read: false,
					type: 'unsorted_media',
					media: {
						id: item.id,
						title: item.title || 'Untitled',
						source: item.source_email || 'Unknown source',
						url: item.url
					}
				}))
				.filter(notification => !dismissedNotifications.includes(notification.id));
			
			// Only show media notifications
			setNotifications(mediaNotifications);
		} catch (err) {
			console.error('Error in fetchUnsortedMedia:', err);
		} finally {
			setLoading(false);
		}
	}, []);
	
	// Handle clear all notifications
	const handleClearAll = React.useCallback(async () => {
		try {
			setClearingAll(true);
			const supabase = createClient();
			
			// Get all unsorted media IDs
			const mediaNotifications = notifications.filter(n => n.type === 'unsorted_media');
			const mediaIds = mediaNotifications.map(n => n.media.id);
			
			if (mediaIds.length > 0) {
				// Update all unsorted media items to 'reviewed' status
				const { error } = await supabase
					.from('media')
					.update({ status: 'reviewed' })
					.in('id', mediaIds);
					
				if (error) {
					console.error('Error clearing notifications:', error);
					return;
				}
			}
			
			// Clear notifications from state
			setNotifications(notifications.filter(n => n.type !== 'unsorted_media'));
			
		} catch (err) {
			console.error('Error in handleClearAll:', err);
		} finally {
			setClearingAll(false);
		}
	}, [notifications]);
	
	// Fetch notifications when popover opens
	React.useEffect(() => {
		if (open) {
			fetchUnsortedMedia();
		}
	}, [open, fetchUnsortedMedia]);

	return (
		<Popover
			anchorEl={anchorEl}
			anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
			onClose={onClose}
			open={open}
			slotProps={{ paper: { sx: { width: "380px" } } }}
			transformOrigin={{ horizontal: "right", vertical: "top" }}
		>
			<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between", px: 3, py: 2 }}>
				<Typography variant="h6">Notifications</Typography>
				<Stack direction="row" spacing={1}>
					<Tooltip title="Mark all as read">
						<IconButton edge="end" onClick={onMarkAllAsRead}>
							<EnvelopeSimpleIcon />
						</IconButton>
					</Tooltip>
					<Tooltip title="Clear all">
						<IconButton 
							edge="end" 
							onClick={handleClearAll}
							disabled={clearingAll || notifications.filter(n => n.type === 'unsorted_media').length === 0}
						>
							{clearingAll ? (
								<CircularProgress size={20} />
							) : (
								<XIcon />
							)}
						</IconButton>
					</Tooltip>
				</Stack>
			</Stack>
			{loading ? (
				<Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
					<Typography variant="body2">Loading notifications...</Typography>
				</Box>
			) : notifications.length === 0 ? (
				<Box sx={{ p: 2 }}>
					<Typography variant="subtitle2">There are no notifications</Typography>
				</Box>
			) : (
				<Box sx={{ maxHeight: "270px", overflowY: "auto" }}>
					<List disablePadding>
						{notifications.map((notification, index) => (
							<NotificationItem
								divider={index < notifications.length - 1}
								key={notification.id}
								notification={notification}
								onRemove={() => {
									// For media notifications, use our custom handler
									if (notification.type === 'unsorted_media') {
										handleDismissNotification(notification.id);
									} else {
										// For other notifications, use the provided handler
										onRemoveOne?.(notification.id);
									}
								}}
							/>
						))}
					</List>
				</Box>
			)}
		</Popover>
	);
}

// Create a custom event for notification changes
const NOTIFICATION_DISMISSED_EVENT = 'notification_dismissed';

// Badge component for the notification bell
export function NotificationsBadge({ children }) {
	const [count, setCount] = React.useState(0);
	
	// Fetch count of unsorted media items
	const fetchCount = React.useCallback(async () => {
		try {
			const supabase = createClient();
			
			const { data, error } = await supabase
				.from('media')
				.select('id')
				.in('status', ['unsorted', 'pending'])
				.neq('is_deleted', true);
				
			if (error) {
				console.error('Error fetching unsorted media count:', error);
				return;
			}
			
			// Get dismissed notifications from localStorage
			let dismissedNotifications = [];
			try {
				const dismissedNotificationsStr = localStorage.getItem('dismissedMediaNotifications') || '[]';
				dismissedNotifications = JSON.parse(dismissedNotificationsStr);
			} catch (e) {
				console.error('Error parsing dismissed notifications:', e);
			}
			
			// Filter out dismissed notifications
			const filteredData = data.filter(item => !dismissedNotifications.includes(`media-${item.id}`));
			
			// Update count
			setCount(filteredData.length);
		} catch (err) {
			console.error('Error in fetchCount:', err);
		}
	}, []);
	
	// Listen for notification dismissed events
	React.useEffect(() => {
		// Fetch initially
		fetchCount();
		
		// Set up interval to check periodically
		const interval = setInterval(fetchCount, 60000); // Check every minute
		
		// Listen for notification dismissed events
		const handleNotificationDismissed = () => {
			fetchCount();
		};
		
		window.addEventListener(NOTIFICATION_DISMISSED_EVENT, handleNotificationDismissed);
		
		return () => {
			clearInterval(interval);
			window.removeEventListener(NOTIFICATION_DISMISSED_EVENT, handleNotificationDismissed);
		};
	}, [fetchCount]);
	
	return (
		<Badge 
			badgeContent={count} 
			color="error"
			invisible={count === 0}
		>
			{children}
		</Badge>
	);
}

function NotificationItem({ divider, notification, onRemove }) {
	return (
		<ListItem divider={divider} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
			<NotificationContent notification={notification} />
			<Tooltip title="Dismiss">
				<IconButton edge="end" onClick={onRemove} size="small">
					<XIcon />
				</IconButton>
			</Tooltip>
		</ListItem>
	);
}

function NotificationContent({ notification }) {
	if (notification.type === "unsorted_media") {
		return (
			<Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
				<Avatar>
					<FileIcon fontSize="var(--Icon-fontSize)" />
				</Avatar>
				<div>
					<Typography variant="subtitle2">New attachment to review</Typography>
					<Typography variant="body2">
						<Link 
							href={paths.dashboard.media.organize} 
							underline="always"
							sx={{ fontWeight: 'medium' }}
						>
							{notification.media.title}
						</Link>
						{notification.media.source && (
							<Typography component="span" variant="body2">
								{" "}from {notification.media.source}
							</Typography>
						)}
					</Typography>
					<Typography color="text.secondary" variant="caption">
						{dayjs(notification.createdAt).format("MMM D, hh:mm A")}
					</Typography>
				</div>
			</Stack>
		);
	}

	if (notification.type === "new_feature") {
		return (
			<Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
				<Avatar>
					<ChatTextIcon fontSize="var(--Icon-fontSize)" />
				</Avatar>
				<div>
					<Typography variant="subtitle2">New feature!</Typography>
					<Typography variant="body2">{notification.description}</Typography>
					<Typography color="text.secondary" variant="caption">
						{dayjs(notification.createdAt).format("MMM D, hh:mm A")}
					</Typography>
				</div>
			</Stack>
		);
	}

	if (notification.type === "new_company") {
		return (
			<Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
				<Avatar src={notification.author.avatar}>
					<UserIcon />
				</Avatar>
				<div>
					<Typography variant="body2">
						<Typography component="span" variant="subtitle2">
							{notification.author.name}
						</Typography>{" "}
						created{" "}
						<Link underline="always" variant="body2">
							{notification.company.name}
						</Link>{" "}
						company
					</Typography>
					<Typography color="text.secondary" variant="caption">
						{dayjs(notification.createdAt).format("MMM D, hh:mm A")}
					</Typography>
				</div>
			</Stack>
		);
	}

	if (notification.type === "new_job") {
		return (
			<Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
				<Avatar src={notification.author.avatar}>
					<UserIcon />
				</Avatar>
				<div>
					<Typography variant="body2">
						<Typography component="span" variant="subtitle2">
							{notification.author.name}
						</Typography>{" "}
						added a new job{" "}
						<Link underline="always" variant="body2">
							{notification.job.title}
						</Link>
					</Typography>
					<Typography color="text.secondary" variant="caption">
						{dayjs(notification.createdAt).format("MMM D, hh:mm A")}
					</Typography>
				</div>
			</Stack>
		);
	}

	return <div />;
}
