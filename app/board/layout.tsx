import HamburgerMenu from '../components/HamburgerMenu';

export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HamburgerMenu />
      {children}
    </>
  );
}