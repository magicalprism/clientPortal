'use client';

import {
  Document, Page, Text, View, StyleSheet, Font
} from '@react-pdf/renderer';

function getStatusStyle(status) {
  const colorMap = {
    todo: { backgroundColor: '#635bff', color: 'white' },
    in_progress: { backgroundColor: '#fb9c0c', color: 'white' },
    complete: { backgroundColor: '#13a38e', color: 'white' }
  };
  return colorMap[status?.toLowerCase()] || { backgroundColor: '#eee', color: '#555' };
}

Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: '/assets/fonts/roboto/Roboto-Regular.ttf',

    },
    {
      src: '/assets/fonts/roboto/Roboto-Regular.ttf',

    },
  ],
});


const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: 'Roboto',
    color: '#333'
  },
  headerRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 16
},
headerRight: {
  alignItems: 'flex-end',
  flexShrink: 1
},
  logo: {
    width: 100,
    height: 40,
    marginBottom: 16
  },
  heading: {
    fontSize: 18,
    marginBottom: 4,
    fontWeight: 700
  },
  subheading: {
  fontSize: 14,
  marginBottom: 6,
  fontWeight: 500
},
  companyTitle: {
    fontSize: 12,
    marginBottom: 16,
    color: '#666'
  },
  milestone: {
  marginBottom: 24, // more space between milestones
  paddingBottom: 8,
  borderBottomWidth: 1,
  borderBottomColor: '#ddd',
  borderBottomStyle: 'solid'
},
  milestoneTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2
  },
  milestoneDates: {
    fontSize: 10,
    color: '#888',
    marginBottom: 4
  },
  milestoneDescription: {
    fontSize: 10,
    marginBottom: 6,
    color: '#444'
  },
task: {
  marginTop: 16,
  marginBottom: 12
},
subtaskBox: {
  backgroundColor: '#f3f0ff', // primary.50
  border: '1px solid #c5bdfd', // primary.300
  borderRadius: 6,
  padding: 6,
  marginTop: 6
},
subtaskHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'baseline'
},
subtaskContact: {
  fontSize: 8,
  color: '#5a4ad1'
},
  taskTitle: {
    fontSize: 11,
    fontWeight: 500
  },
  subtask: {
  marginLeft: 24,
  marginBottom: 6 // more space between subtasks
},
  subtaskTitle: {
    fontSize: 10,
    color: '#444'
  },
  taskBox: {
  backgroundColor: '#f3f0ff',
  border: '1px solid #c5bdfd',
  borderRadius: 6,
  padding: 8,
  marginBottom: 12,
},
taskHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginBottom: 2
},
taskContact: {
  fontSize: 9,
  color: '#5a4ad1'
},
taskMetaRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginTop: 4,
},
pill: {
  fontSize: 8,
  paddingVertical: 2,
  paddingHorizontal: 6,
  borderRadius: 10,
  marginRight: 6
},
  taskMeta: {
    fontSize: 8,
    color: '#777',
    marginTop: 2
  },
  taskMetaRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  marginTop: 4
}
});


export default function TimelinePdfView({ project, milestones }) {
  return (
    <Document>
      <Page style={styles.page}>


        <View style={styles.headerRow}>
          <Text style={styles.heading}>Project Timeline</Text>
          <View style={styles.headerRight}>
            <Text style={styles.subheading}>{project.title}</Text>
            <Text style={styles.companyTitle}>{project.company_id?.title}</Text>
          </View>
        </View>

        {[...milestones]
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((m) => (
            <View key={m.id} style={styles.milestone}>
              <Text style={styles.milestoneTitle}>{m.title}</Text>
              <Text style={styles.milestoneDates}>
                {formatDate(m.start_date)} – {formatDate(m.end_date)}
              </Text>
              {m.description && (
                <Text style={styles.milestoneDescription}>{m.description}</Text>
              )}

              {[...(m.tasks || [])]
                .filter(t => !t.parent_id)
                .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                .map((task) => {
                  const children = [...(m.tasks || [])]
                    .filter(t => t.parent_id === task.id)
                    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

                  return (
                    <View key={task.id} style={styles.task} wrap={false}>
                      <View style={styles.taskHeader}>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        {task.contact?.title && (
                          <Text style={styles.taskContact}>{task.contact.title}</Text>
                        )}
                      </View>
                      <View style={styles.taskMetaRow}>
                        <Text style={{ ...styles.pill, ...getStatusStyle(task.status) }}>
                          {getStatusLabel(task.status)}
                        </Text>
                        <Text style={styles.taskMeta}>
                          {formatDate(task.start_date)} – {formatDate(task.due_date)}
                        </Text>
                      </View>

                      {children.map((sub) => (
                        <View key={sub.id} style={styles.subtaskBox}>
                          <View style={styles.subtaskHeader}>
                            <Text style={styles.subtaskTitle}>{sub.title}</Text>
                            {sub.contact?.title && (
                              <Text style={styles.subtaskContact}>{sub.contact.title}</Text>
                            )}
                          </View>
                          <View style={styles.taskMetaRow}>
                            <Text style={{ ...styles.pill, ...getStatusStyle(sub.status) }}>
                              {getStatusLabel(sub.status)}
                            </Text>
                            <Text style={styles.taskMeta}>
                              {formatDate(sub.start_date)} – {formatDate(sub.due_date)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                })}
            </View>
        ))}
      </Page>
    </Document>
  );
}






function formatDate(dateString) {
  if (!dateString) return 'TBD';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getStatusLabel(status) {
  const labels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    complete: 'Complete'
  };
  return labels[status?.toLowerCase()] || status;
}
