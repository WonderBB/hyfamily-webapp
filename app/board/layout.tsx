import HamburgerMenu from '../components/HamburgerMenu';

export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HamburgerMenu />
      <main style={{ paddingLeft: '16px', paddingTop: '48px' }}>
        {children}
      </main>
    </>
  );
}