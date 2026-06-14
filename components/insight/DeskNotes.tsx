/**
 * DeskNotes — v5 "From the desk" block (prototype lines 894–908). The authored
 * editorial notes, highlighter-kicker style. On WIDE this sits UNDER the DV in
 * the left column as a 2-up grid; on narrow, render the same notes in the rail
 * (single column — pass `inline`). Highlighter alternates lime / fire-tint.
 *
 * Pass the question's authored note(s). The schema carries up to two
 * (editorial_note + editorial_note_2); pass whichever exist and the 2-up grid
 * fills. Pure presentational — safe in server or client trees.
 */
const HL = ["var(--lime)", "var(--fire-tint)"]; // #BFEE4F / #FFD9D3

export function DeskNotes({ notes, inline = false }: { notes: string[]; inline?: boolean }) {
  const items = notes.filter(Boolean);
  if (items.length === 0) return null;

  const Note = ({ text, i }: { text: string; i: number }) => (
    <article
      className={`rounded-[10px] border-2 border-ink bg-paper-white px-5 py-[18px] ${
        inline ? "flex items-start gap-3.5" : ""
      }`}
    >
      <span
        className="inline-block whitespace-nowrap px-1 font-label text-[10px] font-bold uppercase tracking-[.14em] text-ink"
        style={{
          backgroundImage: `linear-gradient(180deg,transparent 32%,${HL[i % 2]} 32%,${HL[i % 2]} 92%,transparent 92%)`,
        }}
      >
        Desk note 0{i + 1}
      </span>
      <p className={`font-editorial text-[15.5px] leading-[1.45] text-ink ${inline ? "" : "mt-2.5"}`}>
        {text}
      </p>
    </article>
  );

  if (inline) {
    return (
      <div className="flex flex-col gap-3">
        {items.map((t, i) => (
          <Note key={i} text={t} i={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-[22px]">
      <div className="flex items-center gap-3">
        <span className="rounded border-[1.5px] border-ink bg-fire px-[11px] py-[5px] font-label text-[10px] font-bold uppercase tracking-[.22em] text-paper">
          From the desk
        </span>
        <span aria-hidden className="h-0.5 flex-1 bg-ink" />
      </div>
      <div className="mt-3.5 grid grid-cols-1 gap-3.5 exp:grid-cols-2">
        {items.map((t, i) => (
          <Note key={i} text={t} i={i} />
        ))}
      </div>
    </div>
  );
}

export default DeskNotes;
