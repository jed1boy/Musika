import { Github } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 p-6 md:p-8 pointer-events-none">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        <div className="text-white font-bold text-2xl tracking-tighter mix-blend-difference pointer-events-auto">
          M.
        </div>
        
        <a 
          href="https://github.com/jed1boy/Musika" 
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto flex items-center gap-3 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full transition-colors duration-300"
        >
          <Github size={18} />
          <span className="text-sm font-medium tracking-wide">Star on GitHub</span>
        </a>
      </div>
    </nav>
  );
}