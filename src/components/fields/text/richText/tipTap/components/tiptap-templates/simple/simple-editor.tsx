import * as React from "react";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import { Button as MuiButton } from "@mui/material";

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Underline } from "@tiptap/extension-underline";

// --- ADD TABLE EXTENSIONS ---
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

// --- Custom Extensions ---
import { Link } from "@/components/fields/text/richText/tipTap/components/tiptap-extension/link-extension";
import { Selection } from "@/components/fields/text/richText/tipTap/components/tiptap-extension/selection-extension";
import { TrailingNode } from "@/components/fields/text/richText/tipTap/components/tiptap-extension/trailing-node-extension";

// --- UI Primitives ---
import { Button } from "@/components/fields/text/richText/tipTap/components/tiptap-ui-primitive/button";
import { Spacer } from "@/components/fields/text/richText/tipTap/components/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/fields/text/richText/tipTap/components/tiptap-ui-primitive/toolbar";

// --- Nodes ---
import { ImageUploadNode } from "@/components/fields/text/richText/tipTap/components/tiptap-node/image-upload-node/image-upload-node-extension";
import "@/components/fields/text/richText/tiptap/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/fields/text/richText/tiptap/components/tiptap-node/list-node/list-node.scss";
import "@/components/fields/text/richText/tiptap/components/tiptap-node/image-node/image-node.scss";
import "@/components/fields/text/richText/tiptap/components/tiptap-node/paragraph-node/paragraph-node.scss";

// --- UI ---
import { HeadingDropdownMenu } from "@/components/fields/text/richText/tipTap/components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/fields/text/richText/tipTap/components/tiptap-ui/image-upload-button";
import { ListDropdownMenu } from "@/components/fields/text/richText/tipTap/components/tiptap-ui/list-dropdown-menu";
import { NodeButton } from "@/components/fields/text/richText/tipTap/components/tiptap-ui/node-button";
import {
  HighlightPopover,
  HighlightContent,
  HighlighterButton,
} from "@/components/fields/text/richText/tipTap/components/tiptap-ui/highlight-popover";
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/fields/text/richText/tipTap/components/tiptap-ui/link-popover";
import { MarkButton } from "@/components/fields/text/richText/tipTap/components/tiptap-ui/mark-button";
import { TextAlignButton } from "@/components/fields/text/richText/tipTap/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "@/components/fields/text/richText/tipTap/components/tiptap-ui/undo-redo-button";

// --- Icons ---
import { ArrowLeftIcon } from "@/components/fields/text/richText/tipTap/components/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/fields/text/richText/tipTap/components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/fields/text/richText/tipTap/components/tiptap-icons/link-icon";

// --- Hooks ---
import { useMobile } from "@/components/fields/text/richText/tipTap/hooks/use-mobile";
import { useWindowSize } from "@/components/fields/text/richText/tipTap/hooks/use-window-size";

// --- Other ---
import { ThemeToggle } from "@/components/fields/text/richText/tipTap/components/tiptap-templates/simple/theme-toggle";
import { handleImageUpload, MAX_FILE_SIZE } from "@/components/fields/text/richText/tipTap/lib/tiptap-utils";
import "@/components/fields/text/richText/tiptap/components/tiptap-templates/simple/simple-editor.scss";

// --- Props ---
type SimpleEditorProps = {
  content?: string;
  editable?: boolean;
  onChange?: (html: string) => void;
};

export function SimpleEditor({
  content = "",
  editable = true,
  onChange,
}: SimpleEditorProps) {
  const isMobile = useMobile();
  const windowSize = useWindowSize();
  const [mobileView, setMobileView] = React.useState<"main" | "highlighter" | "link">("main");
  const [rect, setRect] = React.useState({ y: 0 });
  const [editorContent, setEditorContent] = React.useState(content);

  const editor = useEditor({
    content,
    editable,
    immediatelyRender: false, // Fix SSR hydration mismatch
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      // Configure Table extensions to allow inline styles
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          // Allow style attributes
          style: null,
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          style: null,
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          style: null,
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          style: null,
        },
      }),
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      TrailingNode,
      Link.configure({ openOnClick: false }),
    ],
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
      },
      // Add this to preserve HTML attributes and styles
      transformPastedHTML(html) {
        return html; // Don't strip any HTML
      },
    },
    // Add parsing options to preserve styles
    parseOptions: {
      preserveWhitespace: 'full',
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChange && html !== content) {
        onChange(html);
      }
    },
  });

  React.useEffect(() => {
    setRect(document.body.getBoundingClientRect());
  }, []);

  React.useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  const handleSave = () => {
    if (onChange) onChange(editorContent);
  };

  return (
    <EditorContext.Provider value={{ editor }}>
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
        <Toolbar
          style={
            isMobile
              ? { bottom: `calc(100% - ${windowSize.height - rect.y}px)` }
              : {}
          }
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <div className="content-wrapper">
          <EditorContent editor={editor} className="simple-editor-content"  />
        </div>
      </div>
    </EditorContext.Provider>
  );
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void;
  onLinkClick: () => void;
  isMobile: boolean;
}) => (
  <>
    <Spacer />
    <ToolbarGroup>
      <UndoRedoButton action="undo" />
      <UndoRedoButton action="redo" />
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <HeadingDropdownMenu levels={[1, 2, 3, 4]} />
      <ListDropdownMenu types={["bulletList", "orderedList", "taskList"]} />
      <NodeButton type="codeBlock" />
      <NodeButton type="blockquote" />
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <MarkButton type="bold" />
      <MarkButton type="italic" />
      <MarkButton type="strike" />
      <MarkButton type="code" />
      <MarkButton type="underline" />
      {!isMobile ? <HighlightPopover /> : <HighlighterButton onClick={onHighlighterClick} />}
      {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <MarkButton type="superscript" />
      <MarkButton type="subscript" />
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <TextAlignButton align="left" />
      <TextAlignButton align="center" />
      <TextAlignButton align="right" />
      <TextAlignButton align="justify" />
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <ImageUploadButton text="Add" />
    </ToolbarGroup>
    <Spacer />
    {isMobile && <ToolbarSeparator />}
    <ToolbarGroup>
      <ThemeToggle />
    </ToolbarGroup>
  </>
);

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link";
  onBack: () => void;
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>
    <ToolbarSeparator />
    {type === "highlighter" ? <HighlightContent /> : <LinkContent />}
  </>
);