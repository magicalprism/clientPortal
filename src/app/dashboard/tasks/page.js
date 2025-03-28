// app/dashboard/tasks/page.js
import { createClient } from '@/lib/supabase/server'
import { appConfig } from '@/config/app'
import { dayjs } from '@/lib/dayjs'
import { TasksProvider } from '@/components/dashboard/tasks/tasks-context'
import { TasksView } from '@/components/dashboard/tasks/tasks-view'

export const metadata = {
  title: `Tasks | Dashboard | ${appConfig.name}`,
}

export default async function Page() {
  const supabase = await createClient()

  const { data: tasksRaw, error } = await supabase.from('task').select(`
	id,
	title,
	description,
	status,
	due_date,
	createdAt,
	author:contact!task_authorId_fkey(*),
	assignees:contact_task(contact:contact!contact_task_assignedId_fkey(*)),
	subtasks,
	attachments,
	comments:comment(*, author:contact(*))
  `)
  
  

  if (error) {
	console.error('Error fetching tasks:', typeof error === 'object' ? error.message : error)
	return null
  }
  

  const columns = [
    { id: 'COL-001', name: 'Todo', taskIds: [] },
    { id: 'COL-002', name: 'Progress', taskIds: [] },
    { id: 'COL-003', name: 'Done', taskIds: [] },
  ]

  const tasks = (tasksRaw || []).map((task) => {
    const columnId =
      task.status === 'Todo'
        ? 'COL-001'
        : task.status === 'Progress'
        ? 'COL-002'
        : 'COL-003'

    const assignees = (task.assignees || []).map((entry) => entry.contact)

    const col = columns.find((col) => col.id === columnId)
    if (col) col.taskIds.push(task.id)

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      columnId,
      createdAt: dayjs(task.createdAt).toDate(),
      due_date: task.due_date ? dayjs(task.due_date).toDate() : null,
      author: task.author,
      assignees,
      labels: [], // Add logic if labels are in your schema
      subscribed: false,
      subtasks: task.subtasks || [],
      attachments: task.attachments || [],
      comments: (task.comments || []).map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: dayjs(c.created_at).toDate(),
        author: c.author,
        comments: [], // Add nesting logic if needed
      })),
    }
  })

  return (
    <TasksProvider columns={columns} tasks={tasks}>
      <TasksView />
    </TasksProvider>
  )
}
