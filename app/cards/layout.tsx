import HamburgerMenu from '../components/HamburgerMenu';

export default function CardLayout({
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
