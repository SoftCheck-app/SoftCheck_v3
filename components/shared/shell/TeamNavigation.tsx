import { Cog6ToothIcon, RectangleGroupIcon, UserGroupIcon, DocumentTextIcon, CircleStackIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import NavigationItems from './NavigationItems';
import { NavigationProps, MenuItem } from './NavigationItems';

interface NavigationItemsProps extends NavigationProps {
  slug: string;
}

const TeamNavigation = ({ slug, activePathname }: NavigationItemsProps) => {
  const { t } = useTranslation('common');

  const menus: MenuItem[] = [
    {
      name: 'Dashboard',
      href: `/teams/${slug}/dashboard`,
      icon: RectangleGroupIcon,
      active: activePathname === `/teams/${slug}/dashboard`,
    },
    {
      name: 'Software Database',
      href: `/teams/${slug}/software`,
      icon: CircleStackIcon,
      active: activePathname === `/teams/${slug}/software`,
    },
    {
      name: 'License Database',
      href: `/teams/${slug}/licenses`,
      icon: DocumentTextIcon,
      active: activePathname === `/teams/${slug}/licenses`,
    },
    {
      name: 'Employees',
      href: `/teams/${slug}/employees`,
      icon: UserGroupIcon,
      active: activePathname === `/teams/${slug}/employees`,
    },
    {
      name: t('settings'),
      href: `/teams/${slug}/settings`,
      icon: Cog6ToothIcon,
      active: activePathname?.startsWith(`/teams/${slug}/settings`),
    },
  ];

  return <NavigationItems menus={menus} />;
};

export default TeamNavigation;
