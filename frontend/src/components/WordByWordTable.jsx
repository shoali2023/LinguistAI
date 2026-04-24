import { Card, CardDescription, CardTitle } from "./ui/card";

export default function WordByWordTable({ items = [], highlightWords = [] }) {
  const highlighted = new Set((highlightWords || []).map((item) => String(item).toLowerCase()));

  return (
    <Card>
      <CardTitle>Word-by-word view</CardTitle>
      <CardDescription className="mt-2">Open this view when you want a closer look at the meaning of each important word.</CardDescription>
      <div className="mt-4 overflow-hidden rounded-2xl border border-border">
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-slate-950/70 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Word</th>
              <th className="px-4 py-3 font-medium">Meaning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-slate-950/30">
            {items.length > 0 ? (
              items.map((item, index) => {
                const isHighlighted = highlighted.has(String(item.word).toLowerCase());
                return (
                  <tr key={`${item.word}-${index}`} className={isHighlighted ? "bg-amber-400/5" : ""}>
                    <td className="px-4 py-3 text-white">{item.word}</td>
                    <td className={`px-4 py-3 ${isHighlighted ? "text-amber-200" : "text-slate-300"}`}>{item.meaning}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-4 text-slate-400" colSpan={2}>
                  Turn on the word-by-word option to see a closer lexical breakdown.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
