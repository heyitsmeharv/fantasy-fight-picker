const NavButton = ({ active, children, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition ${active
          ? "bg-[#d20a11] text-white shadow-lg shadow-red-950/30"
          : "border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
        }`}
    >
      {children}
    </button>
  );
};

export default NavButton;