import { Card, CardDescription, CardTitle } from "./ui/card";

export default function VocabularyCard({ items = [] }) {
  return (
    <Card>
      <CardTitle>Key vocabulary</CardTitle>
      <CardDescription className="mt-2">Important words, their meanings, and a short example you can study.</CardDescription>
      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={`${item.word}-${index}`} className="rounded-2xl bg-slate-950/40 p-4">
              <p className="font-semibold text-white">{item.word}</p>
              <p className="mt-1 text-sm text-slate-200">{item.meaning}</p>
              <p className="mt-2 text-sm text-slate-400">{item.example}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">No vocabulary items were requested for this translation.</p>
        )}
      </div>
    </Card>
  );
}
