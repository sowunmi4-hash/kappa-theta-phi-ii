'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/',             label: 'Home' },
  { href: '/about',        label: 'About' },
  { href: '/brothers',     label: 'Brothers' },
  { href: '/gallery',      label: 'Gallery' },
  { href: '/philanthropy', label: 'Philanthropy' },
  { href: '/apply',        label: 'Apply' },
];

export default function PublicNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className={`pub-nav${scrolled ? ' scrolled' : ''}`}>
      <a href="/" className="pub-nav-brand">KΘΦ II</a>
      <ul className="pub-nav-links">
        {LINKS.map(l => (
          <li key={l.href}>
            <a href={l.href} className={`pub-nav-link${pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href)) ? ' active' : ''}`}>
              {l.label}
            </a>
          </li>
        ))}
      </ul>

      {/* Mobile hamburger */}
      <button className="pub-nav-burger" onClick={() => setOpen(o => !o)}>
        <span/><span/><span/>
      </button>
      {open && (
        <div className="pub-nav-mobile" onClick={() => setOpen(false)}>
          {LINKS.map(l => <a key={l.href} href={l.href} className="pub-nav-mobile-link">{l.label}</a>)}
        </div>
      )}
    </nav>
  );
}
