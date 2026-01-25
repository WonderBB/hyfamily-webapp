import HamburgerMenu from '../components/HamburgerMenu';

export default function CompanyLayout({
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
