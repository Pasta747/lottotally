export default function Disclaimer() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 mt-8">
      <p className="text-sm font-semibold">Beta Disclaimer</p>
      <p className="mt-2 text-sm text-zinc-700">
        Paper trading only. Not financial advice. For testing and research purposes. 
        All trades executed are simulated and do not involve real money or live market orders. 
        Past performance is not indicative of future results. Use at your own risk.
      </p>
    </div>
  );
}