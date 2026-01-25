import HamburgerMenu from '../components/HamburgerMenu';

export default function ScheduleLayout({
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
