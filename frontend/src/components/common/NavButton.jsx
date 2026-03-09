const NavButton = ({ active, children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm transition ${
        active
          ? "bg-[#d20a11] text-white shadow-lg shadow-red-950/30"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
};

export default NavButton;