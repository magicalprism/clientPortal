import { createRoot } from "react-dom/client"
import { SimpleEditor } from "@/components/fields/text/richText/tipTap/components/tiptap-templates/simple/simple-editor"

const App = () => <SimpleEditor />

createRoot(document.getElementById("app")!).render(<App />)
