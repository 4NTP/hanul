export default function Footer() {
  return (
    <footer className="border-t py-8 text-center text-sm text-foreground/60">
      <div className="mx-auto max-w-6xl px-4">
        © {new Date().getFullYear()} Hanul. All rights reserved.
      </div>
    </footer>
  );
}
