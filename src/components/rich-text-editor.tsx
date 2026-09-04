import { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  RotateCcw,
  Eye,
  Edit3
} from 'lucide-react';
import { sanitizeHtml } from '../modules/notices/services/notice-service';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder = 'Escribe el contenido del comunicado...' }: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  const applyTag = (openTag: string, closeTag: string) => {
    const textarea = document.getElementById('rich-editor-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || 'Texto';
    const before = value.substring(0, start);
    const after = value.substring(end);

    const newText = `${before}${openTag}${selectedText}${closeTag}${after}`;
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTag.length, start + openTag.length + selectedText.length);
    }, 10);
  };

  const insertHeading = (level: number) => {
    applyTag(`<h${level}>`, `</h${level}>`);
  };

  const insertParagraph = () => {
    applyTag('<p>', '</p>');
  };

  const insertList = (ordered: boolean) => {
    if (ordered) {
      applyTag('<ol>\n  <li>', '</li>\n  <li>Elemento 2</li>\n</ol>');
    } else {
      applyTag('<ul>\n  <li>', '</li>\n  <li>Elemento 2</li>\n</ul>');
    }
  };

  const insertLink = () => {
    const url = prompt('Ingresa la URL del enlace:', 'https://');
    if (url) {
      applyTag(`<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">`, '</a>');
    }
  };

  const insertCallout = () => {
    applyTag('<blockquote class="border-l-4 border-amber-500 bg-amber-50/70 p-3 rounded-r text-amber-900 my-2">', '</blockquote>');
  };

  const sanitizedPreview = sanitizeHtml(value);

  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-slate-50 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-0.5">
          <button
            type="button"
            onClick={() => insertHeading(2)}
            title="Encabezado H2"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-0.5"
          >
            <Heading2 className="w-4 h-4" />
            <span>H2</span>
          </button>
          <button
            type="button"
            onClick={() => insertHeading(3)}
            title="Encabezado H3"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-0.5"
          >
            <Heading3 className="w-4 h-4" />
            <span>H3</span>
          </button>
          <button
            type="button"
            onClick={insertParagraph}
            title="Párrafo"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700 font-semibold text-xs px-2"
          >
            P
          </button>

          <span className="w-px h-5 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => applyTag('<strong>', '</strong>')}
            title="Negrita"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyTag('<em>', '</em>')}
            title="Cursiva"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyTag('<u>', '</u>')}
            title="Subrayado"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
          >
            <Underline className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => insertList(false)}
            title="Lista con viñetas"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertList(true)}
            title="Lista numerada"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={insertCallout}
            title="Nota destacada / Cita"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={insertLink}
            title="Insertar enlace"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
          >
            <Link className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyTag('<code class="bg-slate-100 text-pink-600 px-1 py-0.5 rounded text-xs font-mono">', '</code>')}
            title="Código en línea"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              isPreview
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            {isPreview ? (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar HTML</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Vista Previa Sanitizada</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {isPreview ? (
        <div className="p-4 min-h-[220px] max-h-[360px] overflow-y-auto bg-slate-50/50 prose prose-slate max-w-none text-sm leading-relaxed">
          {sanitizedPreview ? (
            <div dangerouslySetInnerHTML={{ __html: sanitizedPreview }} />
          ) : (
            <p className="text-slate-400 italic">No hay contenido redactado para previsualizar.</p>
          )}
        </div>
      ) : (
        <textarea
          id="rich-editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={8}
          className="w-full p-4 text-sm font-sans text-slate-900 focus:outline-none resize-y min-h-[220px] max-h-[400px] leading-relaxed"
        />
      )}

      {/* Help footer */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Soporta HTML enriquecido (h2, h3, p, ul, ol, strong, links). Se sanitiza automáticamente en backend.</span>
        <span>{value.length} caracteres</span>
      </div>
    </div>
  );
}
