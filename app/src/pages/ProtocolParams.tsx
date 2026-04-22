const PARAMS = [
  { name: 'Interest Rate (APR)', value: '8%', type: 'Fixed' },
  { name: 'LTV Safe', value: '20%', type: 'Immutable' },
  { name: 'LTV Standard', value: '40%', type: 'Immutable' },
  { name: 'LTV Maximum', value: '60%', type: 'Immutable' },
  { name: 'Maturity Grace Period', value: '72 hours', type: 'Immutable' },
  { name: 'Shield Fee (Early Withdraw)', value: '5%', type: 'Immutable' },
  { name: 'Keeper A Reward', value: '0.6%', type: 'Immutable' },
  { name: 'Keeper B Max Discount', value: '8%', type: 'Immutable' },
  { name: 'Keeper C Reward', value: '1.0 USDC', type: 'Immutable' },
  { name: 'Oracle Freshness', value: '15 seconds', type: 'Immutable' },
];

export default function ProtocolParams() {
  return (
    <section className="relative px-[5vw] py-20 z-10">
      <div className="max-w-[900px] mx-auto">
        <h2
          className="font-heading font-bold text-ginva-text text-center"
          style={{ fontSize: 'clamp(28px, 3vw, 36px)', letterSpacing: '-1px' }}
        >
          Immutable Parameters
        </h2>
        <p className="text-center text-ginva-text-secondary text-base mt-3 max-w-[560px] mx-auto">
          All core parameters are hardcoded and immutable for maximum security.
          No admin can change them.
        </p>
        <div className="mt-10 border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-3 bg-ginva-bg-secondary text-xs font-semibold text-ginva-text-secondary uppercase tracking-wider">
            <span>Parameter</span>
            <span className="text-right">Value</span>
            <span className="text-right">Type</span>
          </div>
          {PARAMS.map((p) => (
            <div
              key={p.name}
              className="grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-3.5 bg-ginva-bg-card items-center"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span className="text-sm text-ginva-text font-medium">
                {p.name}
              </span>
              <span className="font-mono text-sm text-ginva-orange text-right">
                {p.value}
              </span>
              <span className="ml-4">
                <span className="text-xs bg-[rgba(250,104,73,0.15)] text-ginva-orange px-2.5 py-1 rounded-full">
                  {p.type}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
